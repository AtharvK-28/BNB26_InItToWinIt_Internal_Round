"use client";

import { useEffect, useMemo } from "react";
import { useApp } from "@/lib/store";
import type { ContentItem, ContentStatus } from "@/lib/types";
import type { ProjectSummary } from "@/lib/video/api";

/**
 * The content lifecycle (idea → published) lives in the calendar; production lives in the
 * pipeline. Calendar items linked to a project follow its real stage forward, never back.
 */
const ORDER: ContentStatus[] = ["idea", "scripting", "filming", "editing", "scheduled", "published"];
const FROM_PIPELINE: Record<ProjectSummary["stage"], ContentStatus> = {
  "Add footage": "filming",
  "Ready to cut": "editing",
  "Cuts in review": "editing",
  Delivered: "editing",
};

export type PublishStage = "Scheduled" | "Published";

export function useProjectContent(projectId: string) {
  const content = useApp((s) => s.content);
  return useMemo(() => content.filter((c) => c.projectId === projectId), [content, projectId]);
}

/** "Published" or "Scheduled" once a linked post reaches that status. */
export function publishStage(items: ContentItem[]): PublishStage | null {
  if (items.some((c) => c.status === "published")) return "Published";
  if (items.some((c) => c.status === "scheduled")) return "Scheduled";
  return null;
}

export function useSyncProjectContent(projectId: string, summary: ProjectSummary | null, hasScript: boolean) {
  const items = useProjectContent(projectId);
  const updateContent = useApp((s) => s.updateContent);
  useEffect(() => {
    if (!summary) return;
    const target = summary.stage === "Add footage" && !hasScript ? "scripting" : FROM_PIPELINE[summary.stage];
    for (const c of items) if (ORDER.indexOf(c.status) < ORDER.indexOf(target)) updateContent(c.id, { status: target });
  }, [summary, items, updateContent, hasScript]);
  return items;
}
