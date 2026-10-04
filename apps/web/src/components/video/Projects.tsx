"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Clapperboard, Film, LoaderCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { PLATFORMS } from "@/lib/data/meta";
import { useApp } from "@/lib/store";
import { api, mediaUrl, PROJECT_PLATFORMS, projectSummary, updatedLabel, type MediaLinks, type Project, type ProjectPlatform, type ProjectSummary } from "@/lib/video/api";
import { cn } from "@/lib/utils";
import { ApiNotice } from "./Chrome";
import { publishStage, useSyncProjectContent } from "./workflow";

export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<Project[]>("/projects", { signal: controller.signal })
      .then((data) => {
        setProjects(data);
        setError("");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [attempt]);
  return { projects, error, retry: () => setAttempt((n) => n + 1) };
}

/** Thumbnail + stage for one project (asset, clip and export counts). */
function useProjectCard(id: string) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    projectSummary(id, controller.signal)
      .then(async (s) => {
        setSummary(s);
        const cover = s.assets.find((a) => a.kind === "video") ?? s.assets.find((a) => a.kind === "image");
        if (cover) {
          const links = await api<MediaLinks>(`/assets/${cover.id}/links`, { signal: controller.signal });
          setThumb(mediaUrl(links.thumbnail));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [id]);
  return { summary, thumb };
}

export function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  const { summary, thumb } = useProjectCard(project.id);
  const published = publishStage(useSyncProjectContent(project.id, summary, Boolean(project.brief.trim())));
  const label = published ?? summary?.stage;
  const href = summary?.stage === "Add footage" || !summary ? `/studio/projects/${project.id}/material` : summary.stage === "Ready to cut" || summary.stage === "Cuts in review" ? `/studio/projects/${project.id}/cuts` : `/studio/projects/${project.id}/deliver`;
  return (
    <Link href={href} className="group block">
      <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", compact ? "aspect-[4/3]" : "aspect-[20/19]")}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#fff0f3] via-[#f7f7f7] to-[#ebebeb] text-ink-3">
            <Film className="size-8" strokeWidth={1.4} />
            <span className="text-xs font-semibold">No footage yet</span>
          </div>
        )}
        {label && (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-3 py-1 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
              label === "Cuts in review" ? "bg-amber-soft text-amber" : label === "Delivered" || label === "Published" ? "bg-babu-soft text-babu" : label === "Scheduled" ? "bg-sky-soft text-sky" : "bg-white/95 text-ink",
            )}
          >
            {label}
          </span>
        )}
        <span className="absolute right-3 bottom-3 flex gap-1">
          {project.platforms.map((p) => (
            <span key={p} className="flex size-7 items-center justify-center rounded-full bg-white/95 shadow">
              <PlatformGlyph platform={p} size={14} />
            </span>
          ))}
        </span>
      </div>
      <div className="mt-3 text-[15px] leading-5">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-semibold">{project.title}</span>
          <span className="shrink-0 text-sm text-ink-2">{updatedLabel(project.updated_at)}</span>
        </div>
        <div className="truncate text-ink-2">{project.brief.trim() || "No script yet"}</div>
        <div className="mt-1 text-ink-2">
          {summary ? (
            <>
              {summary.assets.length} file{summary.assets.length === 1 ? "" : "s"} · {summary.clips} cut{summary.clips === 1 ? "" : "s"} · {summary.exports} export{summary.exports === 1 ? "" : "s"}
            </>
          ) : (
            <span className="skeleton inline-block h-4 w-40 rounded" />
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProjectsGrid() {
  const { projects, error, retry } = useProjects();
  const [query, setQuery] = useState("");
  if (error) return <ApiNotice error={error} retry={retry} />;
  if (!projects)
    return (
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="skeleton aspect-[20/19] rounded-2xl" />
            <div className="skeleton mt-3 h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    );
  const visible = projects.filter((p) => `${p.title} ${p.brief}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      {projects.length > 3 && (
        <label className="mb-6 flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-line px-5 shadow-search">
          <Search className="size-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project" className="w-full bg-transparent text-sm outline-none" />
        </label>
      )}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <Link href="/studio/projects/new" className="flex aspect-[20/19] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line text-ink-2 transition hover:border-ink hover:text-ink">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-2">
            <Plus className="size-6" />
          </span>
          <span className="font-semibold">New project</span>
          <span className="max-w-52 text-center text-sm">A script, some footage, and the agent finds your clips.</span>
        </Link>
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </>
  );
}

/** Create a project: title, rough script/brief, destinations. */
export function NewProjectForm({ initialBrief = "", initialTitle = "", contentId = "" }: { initialBrief?: string; initialTitle?: string; contentId?: string }) {
  const router = useRouter();
  const planned = useApp((s) => s.content.find((c) => c.id === contentId));
  const updateContent = useApp((s) => s.updateContent);
  const [title, setTitle] = useState(initialTitle);
  const [brief, setBrief] = useState(initialBrief);
  const [platforms, setPlatforms] = useState<ProjectPlatform[]>(() =>
    planned && (PROJECT_PLATFORMS as string[]).includes(planned.platform) ? [planned.platform as ProjectPlatform] : ["youtube", "instagram"],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !platforms.length) return;
    setBusy(true);
    setError("");
    try {
      const p = await api<Project>("/projects", { method: "POST", body: JSON.stringify({ title: title.trim(), brief, platforms }) });
      // A post planned in the calendar now follows this project through production.
      if (planned) updateContent(planned.id, { projectId: p.id });
      router.push(`/studio/projects/${p.id}/material`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[640px]">
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Start a new project</h1>
      <p className="mt-2 text-lg text-ink-2">A working title is enough. Add your script now or later — the clip agent matches it to your footage.</p>

      <label className="mt-8 block">
        <span className="mb-2 block text-sm font-semibold">Working title</span>
        <input
          autoFocus
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. I deleted 80% of my desk"
          className="w-full rounded-xl border border-[#b0b0b0] px-4 py-4 text-lg outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>
      <label className="mt-6 block">
        <span className="mb-2 flex justify-between text-sm font-semibold">
          The idea & rough script <span className="font-normal text-ink-2">Optional</span>
        </span>
        <textarea
          rows={7}
          maxLength={20000}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={"What's the story? Who's it for?\n\nAn opening line, a few beats, or a messy first draft…"}
          className="w-full resize-none rounded-xl border border-[#b0b0b0] px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>
      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold">Where will it live?</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROJECT_PLATFORMS.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                type="button"
                key={p}
                onClick={() => setPlatforms((v) => (on ? v.filter((x) => x !== p) : [...v, p]))}
                aria-pressed={on}
                className={cn("flex flex-col items-start gap-4 rounded-xl border p-4 text-left transition", on ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink")}
              >
                <PlatformGlyph platform={p} size={28} />
                <span>
                  <span className="block font-semibold">{PLATFORMS[p].label}</span>
                  <span className="block text-sm text-ink-2">{PLATFORM_FORMATS[p]}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!platforms.length && <p className="mt-2 text-sm text-arches">Choose at least one destination.</p>}
      </fieldset>
      {error && (
        <div className="mt-6">
          <ApiNotice error={error} />
        </div>
      )}
      <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-6">
        <Link href="/studio/projects" className="font-semibold underline underline-offset-2">
          Cancel
        </Link>
        <Button variant="rausch" size="lg" type="submit" disabled={busy || !title.trim() || !platforms.length}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Clapperboard className="size-4" />} Create & add footage
        </Button>
      </div>
    </form>
  );
}

const PLATFORM_FORMATS: Record<ProjectPlatform, string> = {
  youtube: "Shorts & landscape video",
  instagram: "Reels",
  tiktok: "Vertical video",
  linkedin: "Square feed video",
  x: "Square feed video",
};
