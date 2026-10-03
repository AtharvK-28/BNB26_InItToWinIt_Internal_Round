import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { claudeEnabled, RefusalError, structured } from "@/lib/ai/claude";
import { localBio, localContract, localCounter, localIdeas, localPitch, localReminder, localReplies, localRepurpose, localScript } from "@/lib/ai/local";
import { localClips, localDm, localFeedback, localReport, localTitles } from "@/lib/ai/localGrowth";
import { PROMPTS } from "@/lib/ai/prompts";
import {
  BioSchema,
  ClipsSchema,
  ContractSchema,
  DmSchema,
  EmailSchema,
  IdeasSchema,
  RepliesSchema,
  ReportSchema,
  RepurposeSchema,
  ScriptSchema,
  TitlesSchema,
  type TaskMap,
  type TaskName,
} from "@/lib/ai/schemas";

type Handler<T extends TaskName> = {
  schema: z.ZodType<TaskMap[T]["output"]>;
  prompt: (i: TaskMap[T]["input"]) => { instructions: string; user: string };
  local: (i: TaskMap[T]["input"]) => TaskMap[T]["output"];
  effort: "low" | "medium";
};

const HANDLERS: { [T in TaskName]: Handler<T> } = {
  ideas: { schema: IdeasSchema, prompt: PROMPTS.ideas, local: localIdeas, effort: "low" },
  script: { schema: ScriptSchema, prompt: PROMPTS.script, local: localScript, effort: "low" },
  repurpose: { schema: RepurposeSchema, prompt: PROMPTS.repurpose, local: localRepurpose, effort: "low" },
  pitch: { schema: EmailSchema, prompt: PROMPTS.pitch, local: localPitch, effort: "low" },
  reply: { schema: RepliesSchema, prompt: PROMPTS.reply, local: localReplies, effort: "low" },
  contract: { schema: ContractSchema, prompt: PROMPTS.contract, local: localContract, effort: "medium" },
  reminder: { schema: EmailSchema, prompt: PROMPTS.reminder, local: localReminder, effort: "low" },
  counter: { schema: EmailSchema, prompt: PROMPTS.counter, local: localCounter, effort: "low" },
  bio: { schema: BioSchema, prompt: PROMPTS.bio, local: localBio, effort: "low" },
  titles: { schema: TitlesSchema, prompt: PROMPTS.titles, local: localTitles, effort: "low" },
  clips: { schema: ClipsSchema, prompt: PROMPTS.clips, local: localClips, effort: "medium" },
  feedback: { schema: EmailSchema, prompt: PROMPTS.feedback, local: localFeedback, effort: "low" },
  report: { schema: ReportSchema, prompt: PROMPTS.report, local: localReport, effort: "low" },
  dm: { schema: DmSchema, prompt: PROMPTS.dm, local: localDm, effort: "low" },
};

export async function POST(req: Request) {
  let body: { task?: TaskName; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const task = body.task;
  if (!task || !(task in HANDLERS)) return Response.json({ error: `Unknown task: ${String(task)}` }, { status: 400 });
  const handler = HANDLERS[task] as unknown as Handler<TaskName>;
  const input = body.input as TaskMap[TaskName]["input"];

  let note: string | undefined;
  if (claudeEnabled()) {
    try {
      const p = handler.prompt(input as never);
      const data = await structured(handler.schema, p.instructions, p.user, handler.effort);
      return Response.json({ data, source: "claude" });
    } catch (err) {
      if (err instanceof RefusalError) note = "Claude declined this one — here's a local draft instead.";
      else if (err instanceof Anthropic.AuthenticationError) note = "Claude credentials were rejected — using the local engine.";
      else if (err instanceof Anthropic.RateLimitError) note = "Claude is rate-limited right now — using the local engine.";
      else if (err instanceof Anthropic.APIError) note = `Claude API error (${err.status}) — using the local engine.`;
      else note = "Couldn't reach Claude — using the local engine.";
      console.error(`[ai:${task}]`, err);
    }
  } else {
    // A short pause so loading states read as "thinking" rather than flicker.
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 450));
  }
  return Response.json({ data: handler.local(input as never), source: "local", note });
}
