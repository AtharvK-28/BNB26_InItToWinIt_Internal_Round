"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clapperboard, Eye, MessageSquareText, Mic, Scissors, Sparkles, ThumbsUp } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { api, durationLabel, type Asset } from "@/lib/video/api";
import { type Clip, type Evidence, useRuns } from "@/lib/video/runs";
import { cn } from "@/lib/utils";
import { ApiNotice, PageLoading, ProjectHeader, RunStatus } from "./Chrome";
import { CutEditor } from "./CutEditor";
import { useCapabilities, useProject } from "./useProject";

export function CutsView({ id }: { id: string }) {
  const { project, error: projectError, retry } = useProject(id);
  const caps = useCapabilities();
  const jobs = useRuns(id);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [instruction, setInstruction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [showIndex, setShowIndex] = useState(false);

  const terminal = jobs.runs
    .filter((r) => ["review", "completed", "failed"].includes(r.status))
    .map((r) => `${r.id}:${r.status}`)
    .join();

  useEffect(() => {
    const controller = new AbortController();
    api<Asset[]>(`/projects/${id}/assets`, { signal: controller.signal })
      .then((items) => {
        setAssets(items);
        setSourceId((cur) => cur || items.find((a) => a.kind === "video")?.id || "");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    api<Clip[]>(`/projects/${id}/clips`, { signal: controller.signal })
      .then((values) => {
        setClips(values);
        setSelectedId((cur) => cur || values[0]?.id || "");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [id, terminal, attempt]);

  useEffect(() => {
    if (!sourceId) return;
    const controller = new AbortController();
    api<{ ready: boolean; data: Evidence | null }>(`/assets/${sourceId}/analysis`, { signal: controller.signal })
      .then((v) => setEvidence(v.data))
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [sourceId, terminal]);

  async function manualCut() {
    setManualBusy(true);
    setError("");
    try {
      const clip = await api<Clip>(`/projects/${id}/clips`, { method: "POST", body: JSON.stringify({ request_id: crypto.randomUUID(), asset_id: sourceId }) });
      setClips((v) => [clip, ...v]);
      setSelectedId(clip.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setManualBusy(false);
    }
  }

  if (projectError) return <ApiNotice error={projectError} retry={retry} />;
  if (!project || !caps) return <PageLoading label="Opening your cutting room" />;

  const selected = clips.find((c) => c.id === selectedId);
  const asset = assets.find((a) => a.id === selected?.asset_id);
  const footage = assets.filter((a) => a.kind === "video");
  const review = jobs.runs.find((r) => r.kind === "clips" && r.status === "review");
  const latest = jobs.runs.find((r) => r.kind !== "story");
  const aiReady = caps.ai_ready;

  return (
    <>
      <ProjectHeader project={project} active="cuts" />

      {/* Clip agent */}
      <section className="ai-border mb-6 rounded-3xl p-6 md:p-8" aria-label="Clip agent">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="flex items-center gap-2 text-[22px] font-semibold">
              <AiSpark className="size-5" /> Find the moments
            </h2>
            <p className="mt-2 text-ink-2">The clip agent reads your script, searches what was actually said, inspects frames, and proposes up to three cuts — each with the quote and frames that justify it.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mic className="size-4 text-ink-2" /> Timestamped transcript of your footage
              </li>
              <li className="flex items-center gap-2">
                <Eye className="size-4 text-ink-2" /> Visual check of each candidate window
              </li>
              <li className="flex items-center gap-2">
                <ThumbsUp className="size-4 text-ink-2" /> Nothing is final until you approve it
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Source footage</span>
              <select
                value={sourceId}
                disabled={jobs.active}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setEvidence(null);
                }}
                className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink"
              >
                {!footage.length && <option value="">Add footage in Material first</option>}
                {footage.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.filename} · {durationLabel(a.duration)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">What should the clips say?</span>
              <textarea
                value={instruction}
                rows={2}
                maxLength={2000}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Find the strongest opening and one practical takeaway…"
                className="w-full resize-none rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="rausch" disabled={!sourceId || !aiReady || jobs.active || jobs.busy} onClick={() => void jobs.start("clips", { asset_id: sourceId, instruction })}>
                <Sparkles className="size-4" /> Find my clips
              </Button>
              <Button variant="outline" disabled={!sourceId || manualBusy || editDirty} onClick={() => void manualCut()}>
                <Scissors className="size-4" /> {manualBusy ? "Opening…" : "Cut it myself"}
              </Button>
              <button
                className="text-sm font-semibold underline underline-offset-2 disabled:no-underline disabled:opacity-50"
                disabled={!sourceId || !aiReady || jobs.active || jobs.busy || Boolean(evidence)}
                onClick={() => void jobs.start("analyze", { asset_id: sourceId })}
              >
                {evidence ? "Footage understood ✓" : "Just understand the footage"}
              </button>
            </div>
            {!aiReady && <p className="text-xs text-amber">The clip agent needs the pipeline&apos;s Gemini key. You can still cut manually.</p>}
            {!footage.length && (
              <Link href={`/studio/projects/${id}/material`} className="text-sm font-semibold underline underline-offset-2">
                Bring in your footage
              </Link>
            )}
          </div>
        </div>
      </section>

      {(error || jobs.error) && (
        <div className="mb-6">
          <ApiNotice error={error || jobs.error} retry={() => setAttempt((v) => v + 1)} />
        </div>
      )}
      <RunStatus run={latest} busy={jobs.busy} action={jobs.action} className="mb-6" />

      {review && (
        <section className="mb-6 rounded-3xl bg-amber-soft p-6">
          <div className="text-xs font-bold tracking-wide text-amber uppercase">The agent is waiting for you</div>
          <h2 className="mt-1 text-xl font-semibold">Keep these cuts, or give it a nudge</h2>
          <p className="mt-1 text-sm text-ink">{String(review.output.coverage_notes || "Review the proposals below and adjust anything you like.")}</p>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <Button variant="dark" disabled={jobs.busy || jobs.active} onClick={() => void jobs.action(review, "decision", { action: "approve" })}>
              <ThumbsUp className="size-4" /> Keep these proposals
            </Button>
            <div className="flex min-w-[280px] flex-1 gap-2">
              <input
                value={feedback}
                maxLength={2000}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Or tell it what to change…"
                className="min-w-0 flex-1 rounded-lg border border-[#b0b0b0] bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
              <Button variant="outline" disabled={!feedback.trim() || jobs.busy || jobs.active} onClick={() => void jobs.action(review, "decision", { action: "revise", feedback })}>
                <MessageSquareText className="size-4" /> Revise
              </Button>
            </div>
          </div>
        </section>
      )}

      {evidence && (
        <section className="mb-8 rounded-2xl border border-line-soft">
          <button onClick={() => setShowIndex((v) => !v)} className="flex w-full items-center justify-between p-5 text-left">
            <span>
              <span className="block font-semibold">What the footage contains</span>
              <span className="text-sm text-ink-2">Saved audio + visual index · reused by every request</span>
            </span>
            <span className="text-sm font-semibold underline underline-offset-2">{showIndex ? "Hide" : "Show"}</span>
          </button>
          {showIndex && (
            <div className="border-t border-line-soft p-5">
              <p className="text-sm">{evidence.summary}</p>
              <p className="mt-2 text-xs text-ink-2">Timestamps are estimates — review against the source. {evidence.notes}</p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Mic className="size-4" /> Spoken moments
                  </h3>
                  {!evidence.transcript.length && <p className="text-sm text-ink-2">No audible speech was indexed.</p>}
                  <ul className="thin-scrollbar max-h-72 space-y-2 overflow-y-auto pr-2 text-sm">
                    {evidence.transcript.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] text-white">{s.start.toFixed(1)}s</span>
                        {s.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Eye className="size-4" /> Sampled frames
                  </h3>
                  <ul className="thin-scrollbar max-h-72 space-y-2 overflow-y-auto pr-2 text-sm">
                    {evidence.visuals.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{f.time.toFixed(1)}s</span>
                        {f.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {clips.length ? (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside>
            <h2 className="mb-3 font-semibold">
              Your cuts <span className="font-normal text-ink-2">{clips.length}</span>
            </h2>
            <ul className="space-y-2">
              {clips.map((c, i) => (
                <li key={c.id}>
                  <button
                    aria-pressed={selectedId === c.id}
                    onClick={() => {
                      if (!editDirty || window.confirm("Discard your unsaved edits and open this cut?")) {
                        setEditDirty(false);
                        setSelectedId(c.id);
                      }
                    }}
                    className={cn("w-full rounded-xl border p-3.5 text-left transition", selectedId === c.id ? "border-ink bg-surface" : "border-line-soft hover:border-ink")}
                  >
                    <div className="text-[11px] font-bold tracking-wide text-ink-2 uppercase">
                      Cut {String(i + 1).padStart(2, "0")} · r{c.revision}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-semibold">{c.document.title}</div>
                    <div className="mt-1 text-xs text-ink-2">
                      {c.document.start.toFixed(1)}–{c.document.end.toFixed(1)}s · {(c.document.end - c.document.start).toFixed(1)}s
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          {selected && asset ? (
            <CutEditor
              key={selected.id}
              clip={selected}
              asset={asset}
              project={project}
              projectAssets={assets}
              dirtyChanged={setEditDirty}
              saved={(v) => setClips((cs) => cs.map((c) => (c.id === v.id ? v : c)))}
              exporting={jobs.active || jobs.busy}
              exportCut={(c, preset) => jobs.start("export", { clip_id: c.id, clip_revision: c.revision, preset })}
            />
          ) : (
            <div className="skeleton h-96 rounded-2xl" />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-soft">
            <Clapperboard className="size-6" />
          </span>
          <h3 className="text-xl font-semibold">Your next good moment is in there</h3>
          <p className="mt-2 max-w-md text-ink-2">Choose footage above and let the agent make the first pass — or start a cut yourself. Every proposal stays editable.</p>
        </div>
      )}
    </>
  );
}
