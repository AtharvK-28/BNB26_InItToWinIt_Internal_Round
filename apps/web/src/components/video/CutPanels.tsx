"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Music2, Sparkles, VolumeX } from "lucide-react";
import { AiSpark, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { useApp } from "@/lib/store";
import type { AiSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { durationLabel, mediaUrl, type Asset } from "@/lib/video/api";
import { type Edit, type Preset, presets } from "@/lib/video/runs";
import { useAssetLinks } from "./useProject";

/** Rough per-format guidance shown next to each caption box. */
const LIMITS: Record<Preset, { limit: number; hint: string }> = {
  youtube_shorts: { limit: 2200, hint: "First line works as the title" },
  instagram_reel: { limit: 2200, hint: "First 125 characters show before “more”" },
  tiktok: { limit: 2200, hint: "Short and conversational reads best" },
  youtube_video: { limit: 2200, hint: "Description: summary first, then details" },
  square_post: { limit: 280, hint: "Keep under 280 characters to fit X" },
};

/** Default caption plus per-format copy; the AI writes native copy for each selected format. */
export function CopyPanel({ doc, formats, edit }: { doc: Edit; formats: Preset[]; edit: (fields: Partial<Edit>) => void }) {
  const profile = useApp((s) => s.profile);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<AiSource | null>(null);
  const [note, setNote] = useState("");
  const own = doc.platform_captions ?? {};

  async function write() {
    setBusy(true);
    setNote("");
    try {
      const result = await runAi("copy", {
        creator: creatorBrief(profile),
        title: doc.title,
        hook: doc.hook,
        spoken: doc.subtitle_segments
          .filter((s) => s.end > doc.start && s.start < doc.end)
          .map((s) => s.text)
          .join(" ")
          .slice(0, 3000),
        caption: doc.caption,
        formats,
      });
      const next = { ...own };
      for (const c of result.data.captions) if (formats.includes(c.format)) next[c.format] = c.caption.slice(0, LIMITS[c.format].limit);
      edit({ platform_captions: next });
      setSource(result.source);
      setNote(result.note ?? "");
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <label className="block">
        <span className="mb-1 block font-semibold">Default caption</span>
        <textarea rows={3} maxLength={2200} value={doc.caption} onChange={(e) => edit({ caption: e.target.value })} className="w-full resize-none rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink" />
        <span className="mt-1 block text-xs text-ink-2">Used for any format below that has no copy of its own.</span>
      </label>
      <div className="ai-border flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-1.5 font-semibold">
            <AiSpark className="size-4" /> Adapt for each platform
          </div>
          <p className="text-xs text-ink-2">Native copy and hashtags for the {formats.length} format{formats.length === 1 ? "" : "s"} you&apos;re exporting, from this cut&apos;s title, hook and words.</p>
        </div>
        <Button variant="ai" size="sm" disabled={busy || !formats.length} onClick={() => void write()}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {busy ? "Writing…" : "Write copy"}
        </Button>
      </div>
      {(source || note) && (
        <p className="flex items-center gap-2 text-xs text-ink-2">
          {source && <SourceBadge source={source} />} {note || "Review and edit before you post — nothing is published automatically."}
        </p>
      )}
      {formats.map((p) => {
        const value = own[p] ?? "";
        const { limit, hint } = LIMITS[p];
        return (
          <label key={p} className="block">
            <span className="mb-1 flex justify-between gap-2 font-semibold">
              {presets[p]}
              <span className={cn("font-normal tabular-nums", value.length > limit ? "text-arches" : "text-ink-2")}>
                {value.length}/{limit}
              </span>
            </span>
            <textarea
              rows={3}
              maxLength={limit}
              value={value}
              placeholder={doc.caption ? `Uses the default caption: “${doc.caption.slice(0, 60)}${doc.caption.length > 60 ? "…" : ""}”` : "Uses the default caption"}
              onChange={(e) => {
                const next = { ...own, [p]: e.target.value };
                if (!e.target.value) delete next[p];
                edit({ platform_captions: next });
              }}
              className="w-full resize-none rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink"
            />
            <span className="mt-1 block text-xs text-ink-2">{hint}</span>
          </label>
        );
      })}
      {!formats.length && <p className="rounded-xl bg-surface p-3 text-ink-2">Pick at least one export format below to write copy for it.</p>}
    </div>
  );
}

/** A music bed from the project's audio, looped under the cut at the chosen level. */
export function MusicPanel({ doc, audio, projectId, edit }: { doc: Edit; audio: Asset[]; projectId: string; edit: (fields: Partial<Edit>) => void }) {
  const chosen = audio.find((a) => a.id === doc.music?.asset_id);
  const links = useAssetLinks(chosen?.id);
  if (!audio.length)
    return (
      <div className="rounded-xl bg-surface p-4 text-sm">
        <div className="flex items-center gap-1.5 font-semibold">
          <Music2 className="size-4" /> No music in this project yet
        </div>
        <p className="mt-1 text-ink-2">Add an MP3, WAV or M4A in Material and it can play under any cut.</p>
        <Link href={`/studio/projects/${projectId}/material`} className="mt-3 inline-block font-semibold underline underline-offset-2">
          Add audio in Material
        </Link>
      </div>
    );
  return (
    <div className="space-y-4 text-sm">
      <p className="text-ink-2">The track loops under the cut. Your footage&apos;s own sound stays on top; the bed only fills the background.</p>
      <ul className="space-y-2">
        <li>
          <button onClick={() => edit({ music: null })} aria-pressed={!doc.music} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", !doc.music ? "border-ink bg-surface" : "border-line-soft hover:border-ink")}>
            <VolumeX className="size-4" /> <span className="font-semibold">No music</span>
          </button>
        </li>
        {audio.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => edit({ music: { asset_id: a.id, volume: doc.music?.volume ?? 0.25 } })}
              aria-pressed={doc.music?.asset_id === a.id}
              className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", doc.music?.asset_id === a.id ? "border-ink bg-surface" : "border-line-soft hover:border-ink")}
            >
              <Music2 className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-semibold">{a.filename}</span>
              <span className="text-xs text-ink-2">{durationLabel(a.duration)}</span>
            </button>
          </li>
        ))}
      </ul>
      {doc.music && (
        <>
          <label className="block">
            <span className="mb-1 flex justify-between font-semibold">
              Music level <span className="font-normal text-ink-2">{Math.round(doc.music.volume * 100)}%</span>
            </span>
            <input type="range" min={0} max={1} step={0.05} value={doc.music.volume} onChange={(e) => edit({ music: { ...doc.music!, volume: Number(e.target.value) } })} className="w-full" />
          </label>
          {links && <audio controls preload="metadata" src={mediaUrl(links.original)} className="w-full" />}
          {doc.music && !chosen && <p className="text-arches">This track is no longer in the project. Choose another or remove the music.</p>}
        </>
      )}
    </div>
  );
}
