import { claudeEnabled, streamChat } from "@/lib/ai/claude";
import { localChat } from "@/lib/ai/local";
import { copilotSystem } from "@/lib/ai/prompts";
import type { ChatMessage, CopilotContext } from "@/lib/ai/schemas";

const encoder = new TextEncoder();

function textStream(text: string) {
  // Word-chunked stream so the local engine "types" like a model would.
  const parts = text.match(/\S+\s*/g) ?? [text];
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < parts.length; i += 2) {
        controller.enqueue(encoder.encode(parts.slice(i, i + 2).join("")));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
}

const headers = (source: "claude" | "local") => ({
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-AI-Source": source,
});

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[]; context?: CopilotContext };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const messages = (body.messages ?? []).filter((m) => m.content?.trim());
  const ctx = body.context;
  if (!messages.length || !ctx) return new Response("Missing messages or context", { status: 400 });
  const question = messages[messages.length - 1].content;

  if (claudeEnabled()) {
    try {
      const stream = streamChat(copilotSystem(ctx), messages);
      const events = stream[Symbol.asyncIterator]();

      // Pull until the first text delta so auth/connection errors surface here
      // (and fall back to the local engine) instead of mid-response.
      const buffered: string[] = [];
      let finished = false;
      for (;;) {
        const { value, done } = await events.next();
        if (done) {
          finished = true;
          break;
        }
        if (value.type === "content_block_delta" && value.delta.type === "text_delta") {
          buffered.push(value.delta.text);
          break;
        }
      }

      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          for (const t of buffered) controller.enqueue(encoder.encode(t));
          try {
            while (!finished) {
              const { value, done } = await events.next();
              if (done) break;
              if (value.type === "content_block_delta" && value.delta.type === "text_delta") {
                controller.enqueue(encoder.encode(value.delta.text));
              }
            }
            const final = await stream.finalMessage();
            if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n_I can't help with that one — try rephrasing?_"));
          } catch (err) {
            console.error("[ai:chat] stream error", err);
            controller.enqueue(encoder.encode("\n\n_Connection dropped — please try again._"));
          }
          controller.close();
        },
      });
      return new Response(readable, { headers: headers("claude") });
    } catch (err) {
      console.error("[ai:chat] falling back to local engine", err);
    }
  }
  return new Response(textStream(localChat(question, ctx)), { headers: headers("local") });
}
