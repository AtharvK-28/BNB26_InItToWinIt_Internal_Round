import httpx
import pytest

from creatorai.ai import Gemini, ProviderError, interaction_input
from creatorai.config import Settings
from creatorai.demo_schemas import Understanding


def test_current_response_format_and_low_reasoning(monkeypatch):
    requests = []

    def post(client, url, **kwargs):
        requests.append(kwargs["json"])
        return httpx.Response(
            200,
            json={
                "status": "completed",
                "steps": [
                    {
                        "type": "model_output",
                        "content": [
                            {
                                "type": "text",
                                "text": '{"summary":"test","language":"none",'
                                '"transcript":[],"visuals":[],"notes":""}',
                            }
                        ],
                    }
                ],
                "usage": {"total_input_tokens": 8, "total_output_tokens": 20},
            },
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.Client, "post", post)
    adapter = Gemini(Settings(_env_file=None, gemini_api_key="test-only"))
    result = adapter.structured([{"text": "Test"}], Understanding, "Index source")
    assert result.summary == "test"
    assert requests[0]["response_format"]["mime_type"] == "application/json"
    assert requests[0]["generation_config"]["thinking_level"] == "low"
    assert requests[0]["generation_config"]["thinking_summaries"] == "none"
    assert requests[0]["store"] is False
    assert "$defs" not in requests[0]["response_format"]["schema"]
    assert adapter.usage == {"requests": 1, "input_tokens": 8, "output_tokens": 20}


def test_tool_history_preserves_opaque_steps_and_result_call_ids():
    steps = [
        {"type": "thought", "signature": "opaque-signature"},
        {"type": "function_call", "id": "call-1", "name": "read_script", "arguments": {}},
    ]
    history = interaction_input(
        [
            {"role": "user", "parts": [{"text": "Find clips"}]},
            {"role": "model", "parts": [], "_steps": steps},
            {
                "role": "user",
                "parts": [
                    {
                        "functionResponse": {
                            "name": "read_script",
                            "id": "call-1",
                            "response": {"story": "Actual words"},
                        }
                    }
                ],
            },
        ]
    )
    assert history[1:3] == steps
    assert history[-1]["type"] == "function_result" and history[-1]["call_id"] == "call-1"


def test_quota_error_has_no_automatic_retry(monkeypatch):
    calls = []

    def post(client, url, **kwargs):
        calls.append(url)
        return httpx.Response(429, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.Client, "post", post)
    adapter = Gemini(Settings(_env_file=None, gemini_api_key="test-only"))
    with pytest.raises(ProviderError, match="quota"):
        adapter.generate([{"role": "user", "parts": [{"text": "test"}]}])
    assert len(calls) == 1
