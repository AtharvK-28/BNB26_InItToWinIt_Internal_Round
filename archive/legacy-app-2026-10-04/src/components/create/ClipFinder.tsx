"use client";

import { useState } from "react";
import { CalendarPlus, Scissors, Search } from "lucide-react";
import { ScheduleModal, type ScheduleDraft } from "@/components/studio/ScheduleModal";
import { AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Media";
import { creatorBrief, runAi } from "@/lib/ai/client";
import type { ClipsOut } from "@/lib/ai/schemas";
import type { ImageKey } from "@/lib/images";
import { useApp, useUi } from "@/lib/store";
import type { AiSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAMES: ImageKey[] = ["deskWindow", "macbookWood", "laptopDesk", "keyboard"];
const ts = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

/** Clip finder — the best short-form moments in a long video, scored for virality (Opus Clip-style), plus prompt search. */
export function ClipFinder({ sample }: { sample: string }) {
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [transcript, setTranscript] = useState("");
  const [query, setQuery] = useState("");
  const [clips, setClips] = useState<ClipsOut["clips"] | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);

  const run = async () => {
    if (!transcript.trim()) {
      toast("Paste a transcript first — or use your latest video.");
      return;
    }
    setLoading(true);
    try {
      const res = await runAi("clips", { creator: creatorBrief(profile), transcript, query: query.trim() || undefined });
      setClips(res.data.clips);
      setSource(res.source);
    } catch {
      toast("Couldn't find clips — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-line p-2 shadow-search">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Paste a long-form transcript…"
          className="thin-scrollbar block w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-ink-2"
        />
        <div className="flex flex-col gap-3 border-t border-line-soft px-3 pt-3 pb-1 md:flex-row md:items-center">
          <button onClick={() => setTranscript(sample)} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line-soft">
            Use my latest video
          </button>
          <label className="flex flex-1 items-center gap-2 rounded-full border border-line px-4 py-2">
            <Search className="size-4 text-ink-2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Optional: find the moment where I talk about…" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <button onClick={run} disabled={loading} className="btn-rausch flex h-11 items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-50">
            <Scissors className="size-4" /> Find clips
          </button>
        </div>
      </div>

      <div className="mt-10">
        {loading && (
          <div className="flex gap-5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-56 shrink-0 space-y-2">
                <div className="skeleton aspect-[9/16] rounded-2xl" />
                {i === 0 && <AiThinking label="Watching for hooks" />}
              </div>
            ))}
          </div>
        )}
        {!loading && clips && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold">
                {clips.length ? `${clips.length} clips found` : "No matching moments"}
                {query && <span className="text-base font-normal text-ink-2"> for “{query}”</span>}
              </h2>
              <SourceBadge source={source} />
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
              {clips.map((c, i) => (
                <article key={i} className="w-60 shrink-0 snap-start">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink">
                    <Photo k={FRAMES[i % FRAMES.length]} w={360} h={640} className="absolute inset-0 opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
                    <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {ts(c.startSec)}–{ts(c.endSec)} · {Math.round(c.endSec - c.startSec)}s
                    </span>
                    <ScoreBadge score={c.score} />
                    <span className="absolute top-14 right-3 left-3 text-center text-lg leading-tight font-extrabold text-white uppercase drop-shadow">{c.hook}</span>
                    <span className="absolute right-3 bottom-3 left-3 line-clamp-3 text-xs text-white/90">“{c.quote}”</span>
                  </div>
                  <div className="mt-3 line-clamp-2 text-sm font-semibold">{c.title}</div>
                  <p className="mt-1 text-xs text-ink-2">{c.why}</p>
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setSchedule({ title: c.title, platform: "tiktok", format: "Short", effort: 0.5, notes: c.caption })}>
                    <CalendarPlus className="size-4" /> Schedule as a Short
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}
        {!loading && !clips && (
          <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-soft">
              <Scissors className="size-6" />
            </span>
            <h3 className="text-xl font-semibold">Turn one video into a week of Shorts</h3>
            <p className="mt-2 max-w-md text-ink-2">CreatorAI finds self-contained 20–60 second moments, scores each for hook strength and payoff, and writes the on-screen hook and caption.</p>
          </div>
        )}
      </div>
      <ScheduleModal draft={schedule} onClose={() => setSchedule(null)} />
    </>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={cn("absolute top-3 right-3 flex size-10 flex-col items-center justify-center rounded-full text-white shadow", score >= 80 ? "bg-babu" : score >= 65 ? "bg-[#e07a00]" : "bg-ink-2")}>
      <span className="text-sm leading-none font-bold">{score}</span>
      <span className="text-[7px] font-semibold tracking-wide uppercase">viral</span>
    </span>
  );
}
