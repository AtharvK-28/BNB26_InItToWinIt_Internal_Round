import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { ChatMessage } from "./schemas";

export const MODEL = "claude-opus-5-5";

/**
 * Claude is used when credentials are configured (ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN,
 * or CREATORAI_USE_CLAUDE=1 for an `ant auth login` profile). Otherwise every task falls
 * back to the local engine so the demo always works.
 */
export function claudeEnabled() {
  if (process.env.CREATORAI_AI === "local") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.CREATORAI_USE_CLAUDE === "1");
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export class RefusalError extends Error {}

const BASE_SYSTEM = `You are CreatorAI, the operating system and right hand for an independent content creator.
You write like a sharp, warm creator-economy pro: specific, practical, never generic marketing fluff.
Always write in the creator's own voice when drafting content or emails for them.
Use concrete numbers from the context provided. Never invent stats that contradict the context.
Brands, people and companies in this product are fictional; treat them as real for the task.`;

/** One structured-output call. Effort is low by default — these are short, latency-sensitive tasks. */
export async function structured<S extends z.ZodType>(
  schema: S,
  instructions: string,
  userContent: string,
  effort: "low" | "medium" | "high" = "low",
): Promise<z.infer<S>> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system: `${BASE_SYSTEM}\n\n${instructions}`,
    messages: [{ role: "user", content: userContent }],
  });
  if (res.stop_reason === "refusal") throw new RefusalError("Claude declined this request");
  if (!res.parsed_output) throw new Error("No structured output returned");
  return res.parsed_output as z.infer<S>;
}

/** Streams the copilot's answer as plain text chunks. */
export function streamChat(system: string, messages: ChatMessage[]) {
  return getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: `${BASE_SYSTEM}\n\n${system}`,
    messages,
  });
}
