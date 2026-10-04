"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, X } from "lucide-react";
import { AiSpark, EngineStatus, Markdown, SourceBadge } from "@/components/ui/Ai";
import { buildCopilotContext, streamCopilot } from "@/lib/ai/client";
import type { ChatMessage } from "@/lib/ai/schemas";
import { useApp, useUi } from "@/lib/store";
import type { AiSource } from "@/lib/types";

const SUGGESTIONS = [
  "What should I focus on this week?",
  "How much am I owed right now?",
  "Any new booking requests?",
  "What did Lumen say about my draft?",
  "Should I sign the Halcyon contract?",
  "What should I charge for a YouTube integration?",
  "Give me 3 video ideas",
  "Am I overworking?",
];

interface Msg extends ChatMessage {
  source?: AiSource;
}

export function Copilot() {
  const open = useUi((s) => s.copilotOpen);
  const close = useUi((s) => s.closeCopilot);
  const firstName = useApp((s) => s.profile.firstName);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const s = useApp.getState();
      const source = await streamCopilot(
        history.map(({ role, content }) => ({ role, content })),
        buildCopilotContext(s),
        (full) => setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]),
        abort.current.signal,
      );
      setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1], source }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: "Sorry — I couldn't reach the AI just now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  // Opened with a prompt (e.g. an "Ask AI" button elsewhere): subscribe to the UI store.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(
    () =>
      useUi.subscribe((s, prev) => {
        if (s.copilotOpen && s.copilotPrompt && s.copilotPrompt !== prev.copilotPrompt) sendRef.current(s.copilotPrompt);
      }),
    [],
  );
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [msgs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex justify-end md:inset-auto md:top-24 md:right-6 md:bottom-6">
      <div className="absolute inset-0 bg-black/30 md:hidden" onClick={close} />
      <div className="relative flex h-full w-full animate-pop flex-col overflow-hidden bg-white shadow-float md:w-[420px] md:rounded-3xl md:border md:border-line-soft">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line-soft px-5">
          <span className="ai-bg flex size-8 items-center justify-center rounded-full">
            <AiSpark className="size-4 [&_path]:fill-white" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">CreatorAI</div>
            <EngineStatus />
          </div>
          {msgs.length > 0 && (
            <button onClick={() => { abort.current?.abort(); setMsgs([]); }} className="flex size-8 items-center justify-center rounded-full hover:bg-surface-2" aria-label="New chat">
              <RotateCcw className="size-4" />
            </button>
          )}
          <button onClick={close} className="flex size-8 items-center justify-center rounded-full hover:bg-surface-2" aria-label="Close">
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        <div ref={scroller} className="thin-scrollbar flex-1 overflow-y-auto px-5 py-5">
          {msgs.length === 0 ? (
            <div className="flex h-full flex-col">
              <div className="mt-6 mb-6">
                <h2 className="text-[26px] leading-tight font-semibold tracking-tight">
                  Hi {firstName}, what can I take <span className="ai-text">off your plate?</span>
                </h2>
                <p className="mt-2 text-sm text-ink-2">I can see your deals, calendar, inbox and earnings — ask me anything.</p>
              </div>
              <div className="grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-xl border border-line px-4 py-3 text-left text-sm font-medium transition hover:border-ink hover:bg-surface">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">{m.content}</div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-3">
                    <AiSpark className="mt-1 size-5 shrink-0" />
                    <div className="min-w-0 flex-1 text-sm">
                      {m.content ? (
                        <>
                          <Markdown text={m.content} />
                          {m.source && <SourceBadge source={m.source} className="mt-3" />}
                        </>
                      ) : (
                        <span className="inline-flex gap-1 pt-2">
                          {[0, 1, 2].map((d) => (
                            <span key={d} className="size-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d * 120}ms` }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="shrink-0 border-t border-line-soft p-4"
        >
          <div className="flex items-end gap-2 rounded-3xl border border-line px-4 py-2 transition focus-within:border-ink focus-within:shadow-soft">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about deals, money, content…"
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-rausch text-white transition disabled:bg-line"
              aria-label="Send"
            >
              <ArrowUp className="size-4" strokeWidth={3} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Floating launcher shown on Studio pages. */
export function CopilotLauncher() {
  const open = useUi((s) => s.copilotOpen);
  const openCopilot = useUi((s) => s.openCopilot);
  const pathname = usePathname();
  if (open || pathname.startsWith("/studio/inbox")) return null;
  return (
    <button
      onClick={() => openCopilot()}
      className="fixed right-5 bottom-20 z-40 flex h-14 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-sm font-semibold text-white shadow-float transition hover:scale-[1.03] md:right-8 md:bottom-8"
    >
      <span className="ai-bg flex size-8 items-center justify-center rounded-full">
        <AiSpark className="size-4 [&_path]:fill-white" />
      </span>
      Ask CreatorAI
    </button>
  );
}
