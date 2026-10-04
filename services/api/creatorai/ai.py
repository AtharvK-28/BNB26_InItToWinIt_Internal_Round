"""Server-only Gemini Interactions adapter. Stateless, bounded, validated, no fake fallback."""

import json
import re
import time

import httpx

from creatorai.config import Settings


class ProviderError(Exception):
    pass


def provider_schema(schema):
    """Flatten local references; leave business constraints to Pydantic validation."""
    definitions = schema.get("$defs", {})
    supported = {
        "type",
        "properties",
        "items",
        "required",
        "enum",
        "description",
        "additionalProperties",
        "anyOf",
        "minimum",
        "maximum",
    }

    def visit(value):
        if isinstance(value, list):
            return [visit(item) for item in value]
        if not isinstance(value, dict):
            return value
        if "$ref" in value:
            return visit(definitions[value["$ref"].split("/")[-1]])
        return {
            key: (
                {name: visit(item) for name, item in field.items()}
                if key == "properties"
                else visit(field)
            )
            for key, field in value.items()
            if key in supported
        }

    return visit(schema)


def interaction_input(contents):
    history = []
    for message in contents:
        if message.get("_steps"):
            history.extend(message["_steps"])
            continue
        blocks = []
        for part in message["parts"]:
            if "functionResponse" in part:
                response = part["functionResponse"]
                history.append(
                    {
                        "type": "function_result",
                        "name": response["name"],
                        "call_id": response["id"],
                        "result": [{"type": "text", "text": json.dumps(response["response"])}],
                    }
                )
            elif "text" in part:
                blocks.append({"type": "text", "text": part["text"]})
            elif "inlineData" in part:
                media = part["inlineData"]
                blocks.append(
                    {
                        "type": "audio" if media["mimeType"].startswith("audio/") else "image",
                        "mime_type": media["mimeType"],
                        "data": media["data"],
                    }
                )
        if blocks:
            history.append(
                {
                    "type": "model_output" if message["role"] == "model" else "user_input",
                    "content": blocks,
                }
            )
    return history


class Gemini:
    def __init__(self, settings: Settings):
        self.key = settings.gemini_api_key.get_secret_value()
        self.model = settings.gemini_model
        self.next_request = 0.0
        self.usage = {"requests": 0, "input_tokens": 0, "output_tokens": 0}
        if not re.fullmatch(r"[a-zA-Z0-9_.-]+", self.model):
            raise ProviderError("The configured AI model name is invalid.")

    def generate(self, contents, *, system="", schema=None, tools=None):
        if not self.key:
            raise ProviderError("Add GEMINI_API_KEY to the API env to enable AI tools.")
        delay = self.next_request - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        self.next_request = time.monotonic() + 15
        body = {
            "model": self.model,
            "input": interaction_input(contents),
            "store": False,
            "system_instruction": system,
            "generation_config": {
                "max_output_tokens": 4096,
                "thinking_level": "low",
                "thinking_summaries": "none",
            },
        }
        if schema:
            body["response_format"] = {
                "type": "text",
                "mime_type": "application/json",
                "schema": provider_schema(schema),
            }
        if tools:
            body["tools"] = [
                {
                    "type": "function",
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": provider_schema(tool["parametersJsonSchema"]),
                }
                for tool in tools
            ]
            body["generation_config"]["tool_choice"] = {
                "allowed_tools": {"mode": "any", "tools": [tool["name"] for tool in tools]}
            }
        try:
            self.usage["requests"] += 1
            with httpx.Client(timeout=httpx.Timeout(120, connect=15)) as client:
                response = client.post(
                    "https://generativelanguage.googleapis.com/v1beta/interactions",
                    headers={"x-goog-api-key": self.key},
                    json=body,
                )
            if response.status_code == 429:
                raise ProviderError(
                    "The free AI quota is busy or exhausted. Wait a minute, then retry."
                )
            if response.status_code in (401, 403):
                raise ProviderError(
                    "The AI key cannot access this model. Check its free-tier access."
                )
            if response.status_code >= 500:
                raise ProviderError("The AI provider is temporarily unavailable. Retry this task.")
            if not response.is_success:
                reason = response.json().get("error", {}).get("message", "")
                reason = reason.replace(self.key, "[redacted]")[:500]
                raise ProviderError(
                    f"The AI request was rejected ({response.status_code}). "
                    + (reason or "Check model configuration.")
                )
            data = response.json()
            usage = data.get("usage", {})
            self.usage["input_tokens"] += usage.get("total_input_tokens", 0)
            self.usage["output_tokens"] += usage.get("total_output_tokens", 0) + usage.get(
                "total_thought_tokens", 0
            )
            if data.get("status") not in {"completed", "requires_action"}:
                raise ProviderError("The AI could not finish this response. Retry the task.")
            steps, parts = data.get("steps", []), []
            for step in steps:
                if step["type"] == "function_call":
                    parts.append(
                        {
                            "functionCall": {
                                "name": step["name"],
                                "args": step["arguments"],
                                "id": step["id"],
                            }
                        }
                    )
                elif step["type"] == "model_output":
                    parts.extend(
                        {"text": block["text"]}
                        for block in step["content"]
                        if block["type"] == "text"
                    )
            if not parts:
                raise ProviderError("The AI returned no usable output. Retry the task.")
            # Keep opaque signatures for stateless tools; thought summaries are disabled.
            return {"role": "model", "parts": parts, "_steps": steps}
        except (httpx.HTTPError, KeyError, IndexError, ValueError):
            raise ProviderError(
                "The AI connection did not finish. Your saved work is safe; retry."
            ) from None

    def structured(self, parts, model, system):
        content = self.generate(
            [{"role": "user", "parts": parts}], system=system, schema=model.model_json_schema()
        )
        text = "".join(part.get("text", "") for part in content["parts"])
        try:
            return model.model_validate(json.loads(text))
        except ValueError:
            raise ProviderError(
                "The AI response did not match the expected format. Retry this task."
            ) from None
