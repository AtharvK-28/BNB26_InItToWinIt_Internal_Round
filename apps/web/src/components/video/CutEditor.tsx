"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, LoaderCircle, Play, Quote, RotateCcw, Save, Send } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Controls";
import { api, mediaUrl, type Asset, type MediaLinks, type Project } from "@/lib/video/api";
import { type Clip, type Edit, type Preset, presetAspect, presets, presetsFor } from "@/lib/video/runs";
import { cn } from "@/lib/utils";
import { CoverEditor } from "./CoverEditor";
import { CopyPanel, MusicPanel } from "./CutPanels";
import { useWorkspaceIdentity } from "./Session";

const MAX_CUT = 60;
/** Matches HOOK_SECONDS in services/api/creatorai/render.py. */
const HOOK_SECONDS = 3;

/**
 * Editable cut document: trim, title, hook, crop, captions, per-format copy, music and
 * cover. Saves are revisioned on the server; the original footage is never modified.
 */
export function CutEditor({
  clip,
  asset,
  project,
  projectAssets,
  saved: onSaved,
  exporting,
  exportCut,
  dirtyChanged,
}: {
  clip: Clip;
  asset: Asset;
  project: Project;
  /** Every file in the project: images can back the cover, audio can play under the cut. */
  projectAssets: Asset[];
  saved: (c: Clip) => void;
  exporting: boolean;
  exportCut: (c: Clip, p: Preset) => Promise<unknown>;
  dirtyChanged: (v: boolean) => void;
}) {
  const [doc, setDoc] = useState<Edit>(clip.document);
  const [saved, setSaved] = useState(clip);
  const projectId = project.id;
  const [formats, setFormats] = useState<Preset[]>(() => presetsFor(project.platforms));
  const [focus, setFocus] = useState<Preset>(() => presetsFor(project.platforms)[0]);
  const [queued, setQueued] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<MediaLinks | null>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [position, setPosition] = useState(doc.start);
  const [tab, setTab] = useState<"edit" | "captions" | "copy" | "music" | "cover">("edit");
  const video = useRef<HTMLVideoElement>(null);
  const identity = useWorkspaceIdentity();
  const recoveryKey = `creatorai:cut:${identity}:${clip.id}`;
  const [recoveryLoaded, setRecoveryLoaded] = useState(false);
  const dirty = JSON.stringify(doc) !== JSON.stringify(saved.document);
  const valid = doc.title.trim() && doc.start >= 0 && doc.end <= asset.duration && doc.end > doc.start && doc.end - doc.start <= MAX_CUT;
  const caption = doc.subtitle_segments.find((s) => s.start <= position && s.end > position)?.text;

  useEffect(() => dirtyChanged(dirty), [dirty, dirtyChanged]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(recoveryKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.document && typeof draft.document.title === "string" && Array.isArray(draft.document.subtitle_segments) && draft.document.cover) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the browser-owned draft once
          setDoc(draft.document);
          setMessage("Recovered your unsaved edit from this tab.");
          if (draft.revision !== clip.revision) setError("This recovered edit is from an older revision. Download it before loading the latest cut.");
        }
      }
    } catch {
      /* storage is optional */
    }
    setRecoveryLoaded(true);
  }, [recoveryKey, clip.revision]);

  useEffect(() => {
    if (!recoveryLoaded) return;
    try {
      if (dirty) sessionStorage.setItem(recoveryKey, JSON.stringify({ document: doc, revision: saved.revision }));
      else sessionStorage.removeItem(recoveryKey);
    } catch {
      /* storage is optional */
    }
  }, [recoveryLoaded, recoveryKey, doc, dirty, saved.revision]);

  useEffect(() => {
    const controller = new AbortController();
    api<MediaLinks>(`/assets/${asset.id}/links`, { signal: controller.signal })
      .then(setLinks)
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [asset.id, previewAttempt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (fields: Partial<Edit>) => {
    setDoc((v) => ({ ...v, ...fields }));
    setMessage("");
  };

  async function save() {
    setBusy(true);
    setError("");
    try {
      const value = await api<Clip>(`/clips/${saved.id}`, { method: "PUT", body: JSON.stringify({ revision: saved.revision, document: doc }) });
      setSaved(value);
      setDoc(value.document);
      onSaved(value);
      setMessage("Your edit is saved as a new revision.");
      try {
        sessionStorage.removeItem(recoveryKey);
      } catch {}
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function playCut() {
    if (!video.current) return;
    video.current.currentTime = doc.start;
    void video.current.play().catch(() => setError("Press the video's play control to preview."));
  }

  const aspect = presetAspect[focus];
  const audio = projectAssets.filter((a) => a.kind === "audio");
  const images = projectAssets.filter((a) => a.kind === "image");

  function toggleFormat(p: Preset) {
    setFormats((list) => {
      const next = list.includes(p) ? list.filter((x) => x !== p) : [...list, p];
      setFocus(next.includes(p) ? p : (next[0] ?? focus));
      return next;
    });
  }

  /** One render per format; they queue on the server and land in Deliver as each finishes. */
  async function exportAll() {
    setError("");
    let started = 0;
    for (const p of formats) {
      if (!(await exportCut(saved, p))) break;
      started += 1;
    }
    setQueued(started);
    if (started) setMessage(started === 1 ? "Export started — it appears in Deliver when it's ready." : `${started} exports started — each appears in Deliver as it finishes.`);
  }
  const pct = (t: number) => `${(t / asset.duration) * 100}%`;

  return (
    <section aria-label="Edit selected cut" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink-2">Revision {saved.revision} · editable</div>
          <h2 className="truncate text-[22px] font-semibold">{saved.document.title}</h2>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", dirty ? "bg-amber-soft text-amber" : "bg-babu-soft text-babu")} role="status">
          {dirty ? "Unsaved edits" : "Saved"}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,320px)_1fr]">
        {/* Preview */}
        <div>
          <div className={cn("relative mx-auto overflow-hidden rounded-2xl bg-black", aspect === "portrait" ? "aspect-[9/16] max-w-[320px]" : aspect === "square" ? "aspect-square max-w-[320px]" : "aspect-video")}>
            {links ? (
              <video
                ref={video}
                src={mediaUrl(links.original)}
                poster={mediaUrl(links.thumbnail)}
                controls
                playsInline
                preload="metadata"
                className="size-full object-cover"
                style={{ objectPosition: `${doc.crop_x * 100}% center` }}
                onLoadedMetadata={() => {
                  if (video.current) video.current.currentTime = doc.start;
                }}
                onTimeUpdate={(e) => {
                  setPosition(e.currentTarget.currentTime);
                  if (!e.currentTarget.paused && e.currentTarget.currentTime >= doc.end) e.currentTarget.pause();
                }}
                onError={() => setError("The source preview link expired. Refresh it below.")}
              />
            ) : (
              <div className="skeleton size-full" />
            )}
            {doc.hook && position >= doc.start - 0.25 && position < doc.start + HOOK_SECONDS && <span className="pointer-events-none absolute top-4 right-4 left-4 text-center text-lg leading-tight font-extrabold text-white uppercase drop-shadow">{doc.hook}</span>}
            {doc.subtitles && caption && <span className="pointer-events-none absolute right-4 bottom-14 left-4 rounded-lg bg-black/70 px-2 py-1 text-center text-sm font-semibold text-white">{caption}</span>}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="dark" disabled={!links || !valid} onClick={playCut}>
              <Play className="size-3.5" /> Play this cut
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLinks(null);
                setPreviewAttempt((v) => v + 1);
              }}
            >
              <RotateCcw className="size-3.5" /> Refresh preview
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-2">Preview plays your original; crop, captions and the hook are applied on export.</p>
        </div>

        {/* Evidence + controls */}
        <div className="min-w-0 space-y-6">
          <div className="ai-border rounded-2xl p-5 text-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AiSpark className="size-4" /> Why this moment
            </div>
            <p>{doc.rationale || "A cut you started from your original footage."}</p>
            {doc.source_quote && (
              <blockquote className="mt-3 flex gap-2 rounded-xl bg-surface p-3 text-ink">
                <Quote className="mt-0.5 size-4 shrink-0 text-ink-3" />
                <span>{doc.source_quote}</span>
              </blockquote>
            )}
            {doc.script_match && (
              <p className="mt-3">
                <b>Matches your script:</b> <span className="text-ink-2">{doc.script_match}</span>
              </p>
            )}
          </div>

          {/* Range on the source timeline */}
          <div>
            <div className="mb-2 flex justify-between text-xs text-ink-2">
              <span>Cut position in source footage</span>
              <span>
                <b className="text-ink">{Math.max(0, doc.end - doc.start).toFixed(1)}s</b> of {asset.duration.toFixed(1)}s
              </span>
            </div>
            <div className="relative h-10 overflow-hidden rounded-lg bg-surface-2" aria-hidden>
              <span className="absolute inset-y-0 rounded-lg border-2 border-ink bg-rausch/20" style={{ left: pct(Math.max(0, doc.start)), width: pct(Math.max(0, Math.min(asset.duration, doc.end) - Math.max(0, doc.start))) }} />
              <span className="absolute inset-y-0 w-0.5 bg-rausch" style={{ left: pct(Math.min(asset.duration, position)) }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Start (s)</span>
                <input type="number" step={0.1} min={0} max={asset.duration} value={doc.start} onChange={(e) => edit({ start: Number(e.target.value) })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2 tabular-nums outline-none focus:border-ink" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold">End (s)</span>
                <input type="number" step={0.1} min={0} max={asset.duration} value={doc.end} onChange={(e) => edit({ end: Number(e.target.value) })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2 tabular-nums outline-none focus:border-ink" />
              </label>
            </div>
            {!valid && <p className="mt-2 text-sm text-arches">Give the cut a title and a forward range of up to {MAX_CUT} seconds inside the source.</p>}
          </div>

          <div className="inline-flex rounded-full bg-surface-2 p-1">
            {(
              [
                ["edit", "Text & framing"],
                ["captions", `Captions · ${doc.subtitle_segments.length}`],
                ["copy", "Post copy"],
                ["music", doc.music ? "Music · on" : "Music"],
                ["cover", "Cover"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("rounded-full px-4 py-1.5 text-[13px] font-semibold", tab === id ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-2")}>
                {label}
              </button>
            ))}
          </div>

          {tab === "edit" && (
            <div className="space-y-4 text-sm">
              <label className="block">
                <span className="mb-1 block font-semibold">Title</span>
                <input value={doc.title} maxLength={100} onChange={(e) => edit({ title: e.target.value })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink" />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold">On-screen hook</span>
                <input value={doc.hook} maxLength={300} onChange={(e) => edit({ hook: e.target.value })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink" />
                <span className="mt-1 block text-xs text-ink-2">Burned in over the first {HOOK_SECONDS} seconds of every export. Leave empty for none.</span>
              </label>
              <label className="block">
                <span className="mb-1 flex justify-between font-semibold">
                  Frame position <span className="font-normal text-ink-2">{Math.round(doc.crop_x * 100)}% from left</span>
                </span>
                <input type="range" min={0} max={1} step={0.01} value={doc.crop_x} onChange={(e) => edit({ crop_x: Number(e.target.value) })} className="w-full" />
              </label>
            </div>
          )}

          {tab === "captions" && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                <span className="font-semibold">Burn captions into the export</span>
                <Toggle size="sm" on={doc.subtitles} onChange={(v) => edit({ subtitles: v })} label="Burn captions" />
              </div>
              <p className="text-xs text-ink-2">AI timings are estimates — listen to the source and adjust before exporting. Times refer to the original footage.</p>
              {doc.subtitle_segments.map((seg, i) => (
                <div key={i} className="grid grid-cols-[80px_80px_1fr] gap-2">
                  <input aria-label={`Start ${i + 1}`} type="number" step={0.1} min={0} max={asset.duration} value={seg.start} onChange={(e) => edit({ subtitle_segments: doc.subtitle_segments.map((s, k) => (k === i ? { ...s, start: Number(e.target.value) } : s)) })} className="rounded-lg border border-[#b0b0b0] px-2 py-2 tabular-nums outline-none focus:border-ink" />
                  <input aria-label={`End ${i + 1}`} type="number" step={0.1} min={0} max={asset.duration} value={seg.end} onChange={(e) => edit({ subtitle_segments: doc.subtitle_segments.map((s, k) => (k === i ? { ...s, end: Number(e.target.value) } : s)) })} className="rounded-lg border border-[#b0b0b0] px-2 py-2 tabular-nums outline-none focus:border-ink" />
                  <textarea aria-label={`Caption ${i + 1}`} rows={1} maxLength={500} value={seg.text} onChange={(e) => edit({ subtitle_segments: doc.subtitle_segments.map((s, k) => (k === i ? { ...s, text: e.target.value } : s)) })} className="resize-none rounded-lg border border-[#b0b0b0] px-3 py-2 outline-none focus:border-ink" />
                </div>
              ))}
              {!doc.subtitle_segments.length && <p className="rounded-xl bg-surface p-3 text-ink-2">No caption segments in this cut.</p>}
            </div>
          )}

          {tab === "copy" && <CopyPanel doc={doc} formats={formats} edit={edit} />}
          {tab === "music" && <MusicPanel doc={doc} audio={audio} projectId={projectId} edit={edit} />}
          {tab === "cover" && <CoverEditor cover={doc.cover} thumbnail={links ? mediaUrl(links.thumbnail) : undefined} images={images} change={(cover) => edit({ cover })} />}

          {error && <p role="alert" className="rounded-xl bg-arches-soft p-3 text-sm text-arches">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-babu-soft p-3 text-sm text-babu">{message}</p>}

          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-5">
            <Button variant="dark" disabled={busy || !dirty || !valid} onClick={() => void save()}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} {busy ? "Saving…" : "Save edit"}
            </Button>
            <button
              className="text-sm font-semibold underline underline-offset-2 disabled:opacity-40"
              disabled={!dirty || busy}
              onClick={() => {
                setDoc(saved.document);
                setError("");
              }}
            >
              Undo unsaved edits
            </button>
            <button
              className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, asset_id: asset.id, revision: saved.revision, document: doc }, null, 2)], { type: "application/json" }));
                const a = window.document.createElement("a");
                a.href = url;
                a.download = "creatorai-edit.json";
                a.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <Download className="size-3.5" /> Edit plan (JSON)
            </button>
          </div>

          <div className="rounded-2xl border border-line p-5">
            <div className="font-semibold">Export for your platforms</div>
            <p className="mt-0.5 text-sm text-ink-2">One 720p MP4 per format — reframed, captioned, with its own post copy — plus an editable package for each.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Export formats">
              {(Object.keys(presets) as Preset[]).map((p) => (
                <button key={p} onClick={() => toggleFormat(p)} aria-pressed={formats.includes(p)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition", formats.includes(p) ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
                  {presets[p]}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="rausch" disabled={dirty || busy || exporting || !valid || !formats.length} onClick={() => void exportAll()}>
                <Send className="size-4" /> {formats.length > 1 ? `Export ${formats.length} formats` : "Export saved cut"}
              </Button>
              {queued > 0 && exporting && <span className="text-xs text-ink-2">Rendering…</span>}
              {dirty && <span className="text-xs text-ink-2">Save your edit first.</span>}
              <Link href={`/studio/projects/${projectId}/deliver`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2">
                Exports <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
