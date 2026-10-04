"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Download, LoaderCircle, Save, Sparkles, Wand2 } from "lucide-react";
import { AiSpark, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { PLATFORMS } from "@/lib/data/meta";
import { useApp } from "@/lib/store";
import type { AiSource } from "@/lib/types";
import { api, ApiError, PROJECT_PLATFORMS, type Project, type ProjectPlatform } from "@/lib/video/api";
import { type Story, useRuns } from "@/lib/video/runs";
import { cn } from "@/lib/utils";
import { ApiNotice, PageLoading, ProjectHeader, RunStatus } from "./Chrome";
import { useWorkspaceIdentity } from "./Session";
import { useCapabilities, useProject } from "./useProject";

export function StoryView({ id }: { id: string }) {
  const { project, error, retry } = useProject(id);
  if (error) return <ApiNotice error={error} retry={retry} />;
  if (!project) return <PageLoading label="Opening your story" />;
  return <StoryEditor key={project.id} project={project} />;
}

/** The working script for a project — with tab-recovery, revision conflicts and Ctrl/⌘+S. */
function StoryEditor({ project }: { project: Project }) {
  const [title, setTitle] = useState(project.title);
  const [brief, setBrief] = useState(project.brief);
  const [platforms, setPlatforms] = useState<ProjectPlatform[]>(project.platforms);
  const [saved, setSaved] = useState(project);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [recoveryLoaded, setRecoveryLoaded] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const identity = useWorkspaceIdentity();
  const recoveryKey = `creatorai:draft:${identity}:${project.id}`;
  const dirty = title !== saved.title || brief !== saved.brief || platforms.join() !== saved.platforms.join();

  useEffect(() => {
    // Restore an unsaved working copy from this tab; never silently override a newer server revision.
    try {
      const raw = sessionStorage.getItem(recoveryKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft.title === "string" && typeof draft.brief === "string" && Array.isArray(draft.platforms)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
          setTitle(draft.title.slice(0, 120));
          setBrief(draft.brief.slice(0, 20000));
          setPlatforms(draft.platforms.filter((p: string) => p === "youtube" || p === "instagram"));
          setRecovered(true);
          if (draft.revision !== project.revision) {
            setConflict(true);
            setError("Your recovered draft is from an older version. Download it before loading the latest saved story.");
          }
        }
      }
    } catch {
      /* storage may be unavailable */
    }
    setRecoveryLoaded(true);
  }, [recoveryKey, project.revision]);

  useEffect(() => {
    if (!recoveryLoaded) return;
    try {
      if (dirty) sessionStorage.setItem(recoveryKey, JSON.stringify({ title, brief, platforms, revision: saved.revision }));
      else sessionStorage.removeItem(recoveryKey);
    } catch {
      /* storage may be unavailable */
    }
  }, [title, brief, platforms, dirty, saved.revision, recoveryKey, recoveryLoaded]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async () => {
    if (!title.trim() || !platforms.length || busy || conflict || !dirty) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<Project>(`/projects/${saved.id}`, { method: "PUT", body: JSON.stringify({ title, brief, platforms, revision: saved.revision }) });
      setSaved(result);
      setTitle(result.title);
      setJustSaved(true);
      setRecovered(false);
      try {
        sessionStorage.removeItem(recoveryKey);
      } catch {}
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof ApiError && err.status === 409) setConflict(true);
    } finally {
      setBusy(false);
    }
  }, [title, brief, platforms, busy, conflict, dirty, saved, recoveryKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const words = brief.trim() ? brief.trim().split(/\s+/).length : 0;

  return (
    <>
      <ProjectHeader
        project={saved}
        active="story"
        right={
          <span className="text-sm text-ink-2" role="status">
            {busy ? "Saving…" : dirty ? "Unsaved changes" : justSaved ? "Saved" : "All changes saved"}
          </span>
        }
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void save();
          }}
          className="min-w-0"
        >
          {recovered && <p className="mb-4 rounded-xl bg-surface p-3 text-sm">Your unsaved working copy was recovered from this tab.</p>}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Working title</span>
            <input
              value={title}
              maxLength={120}
              required
              onChange={(e) => {
                setTitle(e.target.value);
                setJustSaved(false);
              }}
              disabled={busy}
              className="w-full rounded-xl border border-[#b0b0b0] px-4 py-3.5 text-xl font-semibold outline-none focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </label>
          {!title.trim() && <p className="mt-1 text-sm text-arches">Give your project a title so you can find it later.</p>}
          <label className="mt-6 block">
            <span className="mb-2 flex items-end justify-between text-sm font-semibold">
              The script
              <span className="font-normal text-ink-2">{words} words · the clip agent matches this to your footage</span>
            </span>
            <textarea
              value={brief}
              maxLength={20000}
              rows={16}
              onChange={(e) => {
                setBrief(e.target.value);
                setJustSaved(false);
              }}
              disabled={busy}
              placeholder={"What's the story? Who's it for?\n\nAn opening line, a few beats, or a messy first draft…"}
              className="thin-scrollbar w-full resize-y rounded-xl border border-[#b0b0b0] px-4 py-3 text-[15px] leading-7 outline-none focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </label>
          <fieldset className="mt-6" disabled={busy}>
            <legend className="mb-2 text-sm font-semibold">Destinations</legend>
            <div className="flex flex-wrap gap-2">
              {PROJECT_PLATFORMS.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPlatforms((v) => (on ? v.filter((x) => x !== p) : [...v, p]))}
                    className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition", on ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
                  >
                    <PlatformGlyph platform={p} size={14} /> {PLATFORMS[p].label}
                  </button>
                );
              })}
            </div>
            {!platforms.length && <p className="mt-2 text-sm text-arches">Select at least one destination.</p>}
          </fieldset>
          {error && (
            <div role="alert" className="mt-6 rounded-2xl bg-arches-soft p-4 text-sm text-arches">
              <p>{error}</p>
              {conflict && (
                <div className="mt-3 flex gap-4 text-ink">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                    onClick={() => {
                      const url = URL.createObjectURL(new Blob([`${title}\n\n${brief}`], { type: "text/plain;charset=utf-8" }));
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "creatorai-draft.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-4" /> Download draft
                  </button>
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-2"
                    onClick={() => {
                      try {
                        sessionStorage.removeItem(recoveryKey);
                      } catch {}
                      window.location.reload();
                    }}
                  >
                    Load latest
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-6">
            <span className="text-sm text-ink-2">Ctrl/⌘ + S saves</span>
            <Button variant="dark" type="submit" disabled={busy || conflict || !dirty || !title.trim() || !platforms.length}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : justSaved && !dirty ? <Check className="size-4" /> : <Save className="size-4" />}
              {busy ? "Saving…" : "Save script"}
            </Button>
          </div>
        </form>

        <aside className="space-y-6">
          <StoryAssistant
            project={saved}
            dirty={dirty}
            apply={(text) => {
              setBrief(text);
              setJustSaved(false);
            }}
          />
          <div className="rounded-2xl bg-surface p-5 text-sm">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <Wand2 className="size-4" /> More writing tools
            </div>
            <p className="text-ink-2">Trend radar, title & thumbnail tests and multi-platform repurposing live in Create.</p>
            <Link href="/studio/create" className="mt-3 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              Open Create <ArrowRight className="size-4" />
            </Link>
          </div>
          <Link href={`/studio/projects/${saved.id}/cuts`} className="flex items-center justify-between rounded-2xl border border-line p-5 transition hover:shadow-soft">
            <span>
              <span className="block font-semibold">Find clips in your footage</span>
              <span className="block text-sm text-ink-2">The agent matches this script to what you actually said.</span>
            </span>
            <ArrowRight className="size-5" />
          </Link>
        </aside>
      </div>
    </>
  );
}

/**
 * Hooks + script + caption, applied only when the creator chooses. The pipeline drafts with
 * Gemini; without its key, Studio AI (Claude, or the built-in writer) drafts the same shape.
 */
function StoryAssistant({ project, dirty, apply }: { project: Project; dirty: boolean; apply: (text: string) => void }) {
  const jobs = useRuns(project.id);
  const caps = useCapabilities();
  const profile = useApp((s) => s.profile);
  const [direction, setDirection] = useState("");
  const [studio, setStudio] = useState<{ draft: Story; source: AiSource; note?: string } | null>(null);
  const [studioBusy, setStudioBusy] = useState(false);
  const [studioError, setStudioError] = useState("");
  const ready = Boolean(caps?.ai_ready);
  const fallback = Boolean(caps) && !ready;
  const run = jobs.runs.find((r) => r.kind === "story");
  const draft = fallback ? (studio?.draft ?? null) : run?.status === "completed" ? (run.output as unknown as Story) : null;

  async function draftWithStudioAi() {
    setStudioBusy(true);
    setStudioError("");
    try {
      const result = await runAi("story", { creator: creatorBrief(profile), title: project.title, brief: project.brief, platforms: project.platforms, direction });
      setStudio({ draft: result.data, source: result.source, note: result.note });
    } catch (err) {
      setStudioError((err as Error).message);
    } finally {
      setStudioBusy(false);
    }
  }
  return (
    <section className="ai-border rounded-2xl p-5">
      <div className="flex items-center gap-2 font-semibold">
        <AiSpark className="size-4" /> Hooks, script & caption
      </div>
      <p className="mt-1 text-sm text-ink-2">Three hooks, a working script and a caption from your brief. You choose what goes in.</p>
      <textarea
        value={direction}
        maxLength={2000}
        rows={3}
        onChange={(e) => setDirection(e.target.value)}
        placeholder="A little direction: keep it conversational, lead with the surprise…"
        className="mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
      />
      {dirty && <p className="mt-2 text-xs text-ink-2">Save your script first so the assistant reads your latest words.</p>}
      {fallback ? (
        <>
          <Button variant="ai" size="sm" className="mt-3" disabled={dirty || studioBusy} onClick={() => void draftWithStudioAi()}>
            {studioBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {studioBusy ? "Drafting…" : "Draft hooks & script"}
          </Button>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
            {studio && <SourceBadge source={studio.source} />}
            {studio?.note ?? "The pipeline’s Gemini key isn’t set, so Studio AI drafts this from your script instead."}
          </p>
          {studioError && <p className="mt-2 text-sm text-arches">{studioError}</p>}
        </>
      ) : (
        <>
          <Button variant="ai" size="sm" className="mt-3" disabled={!ready || dirty || jobs.busy || jobs.active} onClick={() => void jobs.start("story", { instruction: direction })}>
            <Sparkles className="size-4" /> Draft hooks & script
          </Button>
          {jobs.error && <p className="mt-2 text-sm text-arches">{jobs.error}</p>}
          <RunStatus run={run} busy={jobs.busy} action={jobs.action} className="mt-4" />
        </>
      )}
      {draft && (
        <div className="mt-4 space-y-3">
          {draft.hooks.map((h, i) => (
            <div key={i} className="rounded-xl bg-surface p-3 text-sm">
              <div className="text-[11px] font-bold tracking-wide text-ink-2 uppercase">
                Hook {i + 1} · {h.angle}
              </div>
              <p className="mt-1 font-medium">“{h.text}”</p>
              <button onClick={() => apply(`${h.text}\n\n${draft.script}`)} className="mt-2 text-xs font-semibold underline underline-offset-2">
                Use this opening + script
              </button>
            </div>
          ))}
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">Script, titles & caption</summary>
            <p className="mt-2 whitespace-pre-wrap text-ink-2">{draft.script}</p>
            <div className="mt-3 font-semibold">Titles</div>
            <ul className="list-disc pl-5 text-ink-2">
              {draft.titles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="mt-3 font-semibold">Caption</div>
            <p className="whitespace-pre-wrap text-ink-2">{draft.caption}</p>
          </details>
        </div>
      )}
    </section>
  );
}
