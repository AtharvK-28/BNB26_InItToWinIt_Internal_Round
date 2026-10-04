"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CalendarPlus, Check, Copy, Download, FileArchive, RefreshCw, Send } from "lucide-react";
import { ScheduleModal, type ScheduleDraft } from "@/components/studio/ScheduleModal";
import { Button } from "@/components/ui/Button";
import { api, mediaUrl } from "@/lib/video/api";
import { type Clip, type Delivery, type Preset, presets, useRuns } from "@/lib/video/runs";
import { useApp, useUi } from "@/lib/store";
import type { ContentItem, Platform } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { ApiNotice, PageLoading, ProjectHeader, RunStatus } from "./Chrome";
import { useProject } from "./useProject";
import { useProjectContent } from "./workflow";

const PRESET_PLATFORM: Record<Preset, { platform: Platform; format: string }> = {
  youtube_shorts: { platform: "youtube", format: "Short" },
  instagram_reel: { platform: "instagram", format: "Reel" },
  tiktok: { platform: "tiktok", format: "Short" },
  youtube_video: { platform: "youtube", format: "Long video" },
  square_post: { platform: "linkedin", format: "Post" },
};

export function DeliverView({ id }: { id: string }) {
  const { project, error: projectError, retry } = useProject(id);
  const jobs = useRuns(id);
  const [exports, setExports] = useState<Delivery[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);
  const planned = useProjectContent(id);
  const completed = jobs.runs
    .filter((r) => r.kind === "export" && r.status === "completed")
    .map((r) => r.id)
    .join();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api<Delivery[]>(`/projects/${id}/exports`, { signal: controller.signal }), api<Clip[]>(`/projects/${id}/clips`, { signal: controller.signal })])
      .then(([items, cs]) => {
        setExports(items);
        setClips(cs);
        setError("");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [id, completed, attempt]);

  if (projectError) return <ApiNotice error={projectError} retry={retry} />;
  if (!project) return <PageLoading label="Opening your exports" />;

  return (
    <>
      <ProjectHeader project={project} active="deliver" />
      {(error || jobs.error) && (
        <div className="mb-6">
          <ApiNotice error={error || jobs.error} retry={() => setAttempt((v) => v + 1)} />
        </div>
      )}
      <RunStatus run={jobs.runs.find((r) => r.kind === "export")} busy={jobs.busy} action={jobs.action} className="mb-6" />
      {exports.length ? (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {exports.map((item) => {
            const clip = clips.find((c) => c.id === item.clip_id);
            const target = PRESET_PLATFORM[item.preset as Preset] ?? PRESET_PLATFORM.youtube_shorts;
            // The copy that was rendered into this export's package (per-format, else the default caption).
            const copy = clip ? (clip.document.platform_captions?.[item.preset as Preset] ?? clip.document.caption) : "";
            return (
              <ExportCard
                key={item.id}
                item={item}
                title={clip?.document.title ?? "Exported cut"}
                copy={copy}
                posts={planned.filter((c) => c.exportId === item.id)}
                onSchedule={() =>
                  setSchedule({ title: clip?.document.title ?? project.title, platform: target.platform, format: target.format, effort: 0.5, notes: copy || undefined, status: "scheduled", aiGenerated: false, projectId: id, exportId: item.id })
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-soft">
            <Send className="size-6" />
          </span>
          <h3 className="text-xl font-semibold">When it feels right, export it</h3>
          <p className="mt-2 max-w-md text-ink-2">Save a cut, then export it for YouTube Shorts, Reels, TikTok, a landscape YouTube video or a square feed post — several at once if you like.</p>
          <Button variant="outline" className="mt-6" href={`/studio/projects/${id}/cuts`}>
            Open the cutting room
          </Button>
        </div>
      )}
      <ScheduleModal draft={schedule} onClose={() => setSchedule(null)} />
    </>
  );
}

function ExportCard({ item, title, copy, posts, onSchedule }: { item: Delivery; title: string; copy: string; posts: ContentItem[]; onSchedule: () => void }) {
  const updateContent = useApp((s) => s.updateContent);
  const toast = useUi((s) => s.toast);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<{ video: string; package: string } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ video: string; package: string }>(`/exports/${item.id}/links`, { signal: controller.signal })
      .then((v) => {
        setLinks(v);
        setError("");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [item.id, attempt]);
  const shape = item.preset === "youtube_video" ? "aspect-video" : item.preset === "square_post" ? "aspect-square" : "aspect-[9/16]";
  return (
    <article>
      <div className={cn("relative overflow-hidden rounded-2xl bg-black", shape)}>
        {links ? (
          <video src={mediaUrl(links.video)} controls playsInline preload="metadata" className="size-full object-contain" onError={() => setError("Refresh the links to play this export.")} />
        ) : (
          <div className="skeleton size-full" />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold shadow">{presets[item.preset as Preset] ?? item.preset}</span>
      </div>
      <div className="mt-3">
        <div className="truncate font-semibold">{title}</div>
        <div className="text-sm text-ink-2">
          {item.duration.toFixed(1)}s · {(item.bytes / 1024 / 1024).toFixed(1)} MB · from edit r{item.clip_revision}
        </div>
      </div>
      {links && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={mediaUrl(links.video)} download="creatorai.mp4" className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-sm font-semibold text-white hover:bg-black">
            <Download className="size-4" /> MP4
          </a>
          <a href={mediaUrl(links.package)} download="creatorai-editable.zip" className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink px-3.5 text-sm font-semibold hover:bg-surface">
            <FileArchive className="size-4" /> Editable package
          </a>
          {copy && (
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(copy).then(() => setCopied(true));
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-surface"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy post copy"}
            </button>
          )}
          {!posts.length && (
            <button onClick={onSchedule} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-surface">
              <CalendarPlus className="size-4" /> Schedule
            </button>
          )}
        </div>
      )}
      {posts.map((p) => (
        <div key={p.id} className={cn("mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm", p.status === "published" ? "bg-babu-soft" : "bg-sky-soft")}>
          <span className="flex items-center gap-2">
            <CalendarCheck className="size-4" />
            {p.status === "published" ? "Published" : "Scheduled"} · {fmtDate(p.date, { weekday: "short", month: "short", day: "numeric" })}
            {p.time ? `, ${p.time}` : ""}
          </span>
          {p.status !== "published" && (
            <button
              onClick={() => {
                updateContent(p.id, { status: "published" });
                toast("Marked as published — it counts toward your calendar and insights.");
              }}
              className="font-semibold underline underline-offset-2"
            >
              Mark as published
            </button>
          )}
        </div>
      ))}
      {error && <p className="mt-2 text-sm text-arches">{error}</p>}
      <button
        onClick={() => {
          setLinks(null);
          setAttempt((v) => v + 1);
        }}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-2 underline underline-offset-2"
      >
        <RefreshCw className="size-3" /> Refresh links (private links last 5 minutes)
      </button>
    </article>
  );
}
