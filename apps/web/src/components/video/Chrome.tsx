"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, ChevronLeft, CircleAlert, Clapperboard, Film, LoaderCircle, PenLine, Send, WifiOff } from "lucide-react";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { PLATFORMS } from "@/lib/data/meta";
import type { Project } from "@/lib/video/api";
import { type Run, working } from "@/lib/video/runs";
import { cn } from "@/lib/utils";

export type Stage = "material" | "story" | "cuts" | "deliver";

const STAGES: { id: Stage; label: string; sub: string; Icon: typeof Film; href: (id: string) => string }[] = [
  { id: "material", label: "Material", sub: "Footage", Icon: Film, href: (id) => `/studio/projects/${id}/material` },
  { id: "story", label: "Story", sub: "Script & hooks", Icon: PenLine, href: (id) => `/studio/projects/${id}` },
  { id: "cuts", label: "Cuts", sub: "Clip agent & edits", Icon: Clapperboard, href: (id) => `/studio/projects/${id}/cuts` },
  { id: "deliver", label: "Deliver", sub: "Exports", Icon: Send, href: (id) => `/studio/projects/${id}/deliver` },
];

/** Project header + Material → Story → Cuts → Deliver tabs (Airbnb listing-tab style). */
export function ProjectHeader({ project, active, right }: { project: Project; active: Stage; right?: ReactNode }) {
  return (
    <div className="mb-8">
      <Link href="/studio/projects" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline">
        <ChevronLeft className="size-4" /> Projects
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">{project.title}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-ink-2">
            {project.platforms.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <PlatformGlyph platform={p} size={14} className="text-ink" /> {PLATFORMS[p].label}
              </span>
            ))}
          </p>
        </div>
        {right}
      </div>
      <nav aria-label="Project stages" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-line-soft">
        {STAGES.map((s, i) => {
          const on = s.id === active;
          return (
            <Link
              key={s.id}
              href={s.href(project.id)}
              aria-current={on ? "page" : undefined}
              className={cn("group relative flex shrink-0 items-center gap-3 px-3 pt-2 pb-4", on ? "text-ink" : "text-ink-2 hover:text-ink")}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-full border text-sm transition", on ? "border-ink bg-ink text-white" : "border-line group-hover:border-ink")}>
                <s.Icon className="size-4" />
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-semibold tracking-wide text-ink-3">0{i + 1}</span>
                <span className="block text-[15px] font-semibold">{s.label}</span>
              </span>
              <span className={cn("absolute right-3 bottom-0 left-3 h-0.5 rounded-full", on ? "bg-ink" : "bg-transparent group-hover:bg-line")} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Live agent / job activity with stop and retry. */
export function RunStatus({ run, busy, action, className }: { run?: Run; busy: boolean; action: (run: Run, action: string) => Promise<void>; className?: string }) {
  if (!run) return null;
  const label = run.kind === "clips" ? "Clip agent" : run.kind === "analyze" ? "Footage understanding" : run.kind === "story" ? "Story draft" : run.kind === "export" ? "Export" : "Task";
  return (
    <section aria-label="Task activity" className={cn("rounded-2xl border border-line-soft p-4", className)}>
      <div role="status" aria-live="polite" className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            working(run) ? "bg-surface-2" : run.status === "failed" ? "bg-arches-soft text-arches" : run.status === "review" ? "bg-amber-soft text-amber" : "bg-babu-soft text-babu",
          )}
        >
          {working(run) ? <LoaderCircle className="size-4 animate-spin" /> : run.status === "failed" ? <CircleAlert className="size-4" /> : <Check className="size-4" strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-ink-2">{label}</div>
          <div className="truncate text-sm font-semibold">{run.stage}</div>
        </div>
        {working(run) && (
          <button className="text-sm font-semibold underline underline-offset-2" disabled={busy} onClick={() => void action(run, "cancel")}>
            Stop
          </button>
        )}
        {(run.status === "failed" || run.status === "cancelled") && (
          <button className="text-sm font-semibold underline underline-offset-2" disabled={busy} onClick={() => void action(run, "retry")}>
            Retry
          </button>
        )}
      </div>
      {run.error && (
        <p role="alert" className="mt-3 rounded-xl bg-arches-soft p-3 text-sm text-arches">
          {run.error}
        </p>
      )}
      {run.events.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">{run.kind === "clips" ? "See what the agent did" : "See each step"} · {run.events.length} steps</summary>
          <ol className="mt-3 space-y-2 border-l-2 border-line-soft pl-4">
            {run.events.map((e, i) => (
              <li key={`${e.time}-${i}`} className="relative">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-ink-3" />
                {e.tool && <span className="mr-1.5 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{e.tool}</span>}
                {e.message}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

export function ApiNotice({ error, retry }: { error: string; retry?: () => void }) {
  const offline = /offline|reach your workspace|fetch/i.test(error);
  return (
    <div role="alert" className="flex items-start gap-4 rounded-2xl border border-line-soft p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2">{offline ? <WifiOff className="size-5" /> : <CircleAlert className="size-5" />}</span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold">{offline ? "The video pipeline isn't running" : "Something went wrong"}</div>
        <p className="mt-1 text-ink-2">{offline ? "Start services/api (see the README) — everything else in CreatorAI keeps working meanwhile." : error}</p>
        {retry && (
          <button onClick={retry} className="mt-3 font-semibold underline underline-offset-2">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function PageLoading({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-8 w-64 rounded-lg" />
      <div className="skeleton h-12 w-full max-w-xl rounded-lg" />
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
