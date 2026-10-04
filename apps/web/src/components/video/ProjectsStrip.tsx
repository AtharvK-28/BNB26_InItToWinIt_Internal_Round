"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clapperboard, LogIn, Plus } from "lucide-react";
import { api, type Project } from "@/lib/video/api";
import type { Run } from "@/lib/video/runs";
import { cloudMode } from "@/lib/video/supabase";
import { ApiNotice } from "./Chrome";
import { ProjectCard, useProjects } from "./Projects";
import { useSession } from "./Session";

/** Today's production strip: recent projects + any clip agent waiting on the creator. */
export function ProjectsStrip() {
  const { session, loading } = useSession();
  if (cloudMode && loading) return <div className="skeleton h-64 rounded-2xl" />;
  if (cloudMode && !session)
    return (
      <Link href="/studio/projects" className="flex items-center gap-4 rounded-2xl border border-line p-5 transition hover:shadow-soft">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-2">
          <LogIn className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Log in to your video workspace</span>
          <span className="block text-sm text-ink-2">Your projects, footage and cuts are private to your account.</span>
        </span>
        <ArrowRight className="size-5" />
      </Link>
    );
  return <Strip />;
}

function Strip() {
  const { projects, error, retry } = useProjects();
  const recent = (projects ?? []).slice(0, 3);
  const waiting = useWaitingReview(recent);
  if (error) return <ApiNotice error={error} retry={retry} />;
  return (
    <div>
      {waiting && (
        <Link href={`/studio/projects/${waiting.id}/cuts`} className="mb-5 flex items-center gap-4 rounded-2xl bg-amber-soft p-5 transition hover:brightness-[0.98]">
          <span className="flex size-11 items-center justify-center rounded-full bg-white">
            <Clapperboard className="size-5 text-amber" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">The clip agent found cuts in “{waiting.title}”</span>
            <span className="block text-sm text-ink">They&apos;re waiting for your approval — keep them or ask for a revision.</span>
          </span>
          <ArrowRight className="size-5" />
        </Link>
      )}
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {!projects
          ? [0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />)
          : recent.map((p) => <ProjectCard key={p.id} project={p} compact />)}
        <Link href="/studio/projects/new" className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-ink-2 transition hover:border-ink hover:text-ink">
          <Plus className="size-6" />
          <span className="font-semibold">New project</span>
          <span className="px-6 text-center text-xs">Script + footage → clips</span>
        </Link>
      </div>
    </div>
  );
}

function useWaitingReview(projects: Project[]) {
  const [waiting, setWaiting] = useState<Project | null>(null);
  const ids = projects.map((p) => p.id).join();
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    Promise.all(projects.map((p) => api<Run[]>(`/projects/${p.id}/runs`, { signal: controller.signal }).then((runs) => (runs.some((r) => r.kind === "clips" && r.status === "review") ? p : null))))
      .then((found) => setWaiting(found.find(Boolean) ?? null))
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  return waiting;
}
