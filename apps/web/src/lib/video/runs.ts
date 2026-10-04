"use client";

/** Pipeline job types + the polling hook for runs (story, analyze, clips, export). */

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type Run = {
  id: string;
  project_id: string;
  kind: "story" | "analyze" | "clips" | "export" | "manual";
  status:
    "queued" | "running" | "review" | "completed" | "failed" | "cancelled";
  stage: string;
  error: string;
  events: { time: string; message: string; tool: string }[];
  output: Record<string, unknown>;
  updated_at: string;
};
export type Segment = { start: number; end: number; text: string };
export type Evidence = {
  summary: string;
  language: string;
  transcript: Segment[];
  visuals: { time: number; description: string }[];
  notes: string;
  timing_quality: string;
};
export type Cover = {
  title: string;
  subtitle: string;
  title_x: number;
  title_y: number;
  subtitle_x: number;
  subtitle_y: number;
  theme: "paper" | "coral" | "ink";
  /** A project image replaces the frame from the cut. */
  image_asset_id?: string | null;
};
export type Music = { asset_id: string; volume: number };
export type Edit = {
  title: string;
  hook: string;
  start: number;
  end: number;
  rationale: string;
  source_quote: string;
  script_match: string;
  caption: string;
  /** Per-format post copy; formats without an entry use caption. */
  platform_captions?: Partial<Record<Preset, string>>;
  crop_x: number;
  subtitles: boolean;
  subtitle_segments: Segment[];
  cover: Cover;
  music?: Music | null;
};
export type Clip = {
  id: string;
  asset_id: string;
  run_id: string;
  revision: number;
  script_revision: number;
  document: Edit;
  created_at: string;
};
export type Delivery = {
  id: string;
  clip_id: string;
  clip_revision: number;
  preset: string;
  bytes: number;
  duration: number;
  created_at: string;
};
export type Story = {
  hooks: { text: string; angle: string }[];
  script: string;
  caption: string;
  titles: string[];
};
export const presets = {
  youtube_shorts: "YouTube Shorts · 9:16",
  instagram_reel: "Instagram Reels · 9:16",
  tiktok: "TikTok · 9:16",
  youtube_video: "YouTube video · 16:9",
  square_post: "Square post · 1:1",
};
export type Preset = keyof typeof presets;
/** Output shape per format (matches PRESETS in services/api/creatorai/render.py). */
export const presetAspect: Record<Preset, "portrait" | "landscape" | "square"> = {
  youtube_shorts: "portrait",
  instagram_reel: "portrait",
  tiktok: "portrait",
  youtube_video: "landscape",
  square_post: "square",
};
/** The formats a project targets by default, from its platforms. */
export function presetsFor(platforms: string[]): Preset[] {
  const map: Record<string, Preset> = { youtube: "youtube_shorts", instagram: "instagram_reel", tiktok: "tiktok", linkedin: "square_post", x: "square_post" };
  const list = [...new Set(platforms.map((p) => map[p]).filter(Boolean))];
  return list.length ? list : ["youtube_shorts"];
}
export const working = (run: Run) =>
  run.status === "queued" || run.status === "running";

export function useRuns(projectId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = runs.some(working);
  const refresh = useCallback(async () => {
    const values = await api<Run[]>(`/projects/${projectId}/runs`);
    setRuns(values);
  }, [projectId]);
  useEffect(() => {
    let live = true;
    const fetchRuns = async () => {
      try {
        const values = await api<Run[]>(`/projects/${projectId}/runs`);
        if (live) {
          setRuns(values);
          setError("");
        }
      } catch (error) {
        if (live) setError((error as Error).message);
      }
    };
    void fetchRuns();
    // Only active work polls. A reload restores jobs from the database.
    const timer = active ? setInterval(() => void fetchRuns(), 2000) : null;
    return () => {
      live = false;
      if (timer) clearInterval(timer);
    };
  }, [projectId, active]);
  async function start(
    kind: Run["kind"],
    fields: Record<string, unknown> = {},
  ) {
    setBusy(true);
    setError("");
    try {
      const run = await api<Run>(`/projects/${projectId}/runs`, {
        method: "POST",
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          kind,
          ...fields,
        }),
      });
      setRuns((values) => [run, ...values]);
      return run;
    } catch (error) {
      setError((error as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function action(run: Run, action: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const result = await api<Run>(`/runs/${run.id}/${action}`, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setRuns((values) =>
        values.map((value) => (value.id === result.id ? result : value)),
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { runs, error, busy, active, refresh, start, action };
}
