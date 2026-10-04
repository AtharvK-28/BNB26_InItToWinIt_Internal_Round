"use client";

import { useEffect, useState } from "react";
import { Bot, Clapperboard, Pencil, Send, Timer } from "lucide-react";
import { api, apiDate, type Asset, type Project } from "@/lib/video/api";
import { type Clip, type Delivery, type Preset, presets, type Run } from "@/lib/video/runs";
import { useApp } from "@/lib/store";
import { cloudMode } from "@/lib/video/supabase";
import { useSession } from "./Session";

interface Stats {
  projects: number;
  footageMin: number;
  agentCuts: number;
  manualCuts: number;
  editedAgentCuts: number;
  avgCutSec: number;
  exportsByPreset: Record<string, number>;
  medianHoursToExport: number | null;
  agentRuns: number;
  failedRuns: number;
}

/**
 * Creator Intelligence for production: computed live from the pipeline (no sample data).
 * How much footage becomes output, how often agent proposals get edited, and how fast.
 */
export function ProductionInsights() {
  const { session, loading } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const blocked = cloudMode && (loading || !session);
  const content = useApp((s) => s.content);
  const linked = content.filter((c) => c.projectId);
  const published = linked.filter((c) => c.status === "published").length;
  const scheduled = linked.filter((c) => c.status === "scheduled").length;

  useEffect(() => {
    if (blocked) return;
    const controller = new AbortController();
    (async () => {
      const projects = await api<Project[]>("/projects", { signal: controller.signal });
      const per = await Promise.all(
        projects.map((p) =>
          Promise.all([
            api<Asset[]>(`/projects/${p.id}/assets`, { signal: controller.signal }),
            api<Clip[]>(`/projects/${p.id}/clips`, { signal: controller.signal }),
            api<Delivery[]>(`/projects/${p.id}/exports`, { signal: controller.signal }),
            api<Run[]>(`/projects/${p.id}/runs`, { signal: controller.signal }),
          ]),
        ),
      );
      const assets = per.flatMap(([a]) => a);
      const clips = per.flatMap(([, c]) => c);
      const exports = per.flatMap(([, , e]) => e);
      const runs = per.flatMap(([, , , r]) => r);
      const kindOf = new Map(runs.map((r) => [r.id, r.kind]));
      const agent = clips.filter((c) => kindOf.get(c.run_id) === "clips");
      const hours: number[] = [];
      for (const [a, , e] of per) {
        if (!a.length || !e.length) continue;
        const first = Math.min(...a.map((x) => +apiDate(x.created_at)));
        const done = Math.min(...e.map((x) => +apiDate(x.created_at)));
        if (done >= first) hours.push((done - first) / 3_600_000);
      }
      hours.sort((x, y) => x - y);
      const exportsByPreset: Record<string, number> = {};
      exports.forEach((x) => (exportsByPreset[x.preset] = (exportsByPreset[x.preset] ?? 0) + 1));
      setStats({
        projects: projects.length,
        footageMin: assets.reduce((s, a) => s + a.duration, 0) / 60,
        agentCuts: agent.length,
        manualCuts: clips.length - agent.length,
        editedAgentCuts: agent.filter((c) => c.revision > 1).length,
        avgCutSec: clips.length ? clips.reduce((s, c) => s + (c.document.end - c.document.start), 0) / clips.length : 0,
        exportsByPreset,
        medianHoursToExport: hours.length ? hours[Math.floor(hours.length / 2)] : null,
        agentRuns: runs.filter((r) => r.kind === "clips").length,
        failedRuns: runs.filter((r) => r.status === "failed").length,
      });
    })().catch((e: Error) => e.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [blocked]);

  return (
    <div className="rounded-2xl border border-line-soft p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Production patterns</h2>
        <span className="text-xs text-ink-2">Live from your projects</span>
      </div>
      <p className="mb-5 text-sm text-ink-2">How your footage turns into finished clips — and how much the agent&apos;s first pass sticks.</p>
      {blocked ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-ink-2">Log in to your video workspace (Projects) to see production patterns.</p>
      ) : error ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-ink-2">The video pipeline isn&apos;t reachable right now — start services/api to see production patterns.</p>
      ) : !stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : stats.projects === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-ink-2">No projects yet. Start one in Projects and your production patterns appear here.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile Icon={Clapperboard} label="Footage in projects" value={`${stats.footageMin.toFixed(1)} min`} sub={`${stats.projects} project${stats.projects === 1 ? "" : "s"}`} />
            <Tile Icon={Bot} label="Cuts by the agent" value={`${stats.agentCuts}`} sub={`${stats.manualCuts} cut manually`} />
            <Tile
              Icon={Pencil}
              label="Agent cuts you edited"
              value={stats.agentCuts ? `${Math.round((stats.editedAgentCuts / stats.agentCuts) * 100)}%` : "—"}
              sub={stats.agentCuts ? `${stats.editedAgentCuts} of ${stats.agentCuts}` : "no agent cuts yet"}
            />
            <Tile Icon={Timer} label="Footage → export" value={stats.medianHoursToExport === null ? "—" : stats.medianHoursToExport < 1 ? `${Math.max(1, Math.round(stats.medianHoursToExport * 60))} min` : `${stats.medianHoursToExport.toFixed(1)} h`} sub="median per project" />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Send className="size-4" /> Exports by format
              </div>
              {Object.keys(stats.exportsByPreset).length ? (
                <ul className="space-y-2">
                  {Object.entries(stats.exportsByPreset).map(([k, n]) => {
                    const max = Math.max(...Object.values(stats.exportsByPreset));
                    return (
                      <li key={k} className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-sm">
                        <span className="truncate text-ink-2">{presets[k as Preset] ?? k}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <span className="block h-full rounded-full bg-ink" style={{ width: `${(n / max) * 100}%` }} />
                        </span>
                        <span className="text-right font-semibold tabular-nums">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">No exports yet.</p>
              )}
            </div>
            <div className="rounded-xl bg-surface p-4 text-sm">
              <div className="font-semibold">Average cut length: {stats.avgCutSec ? `${stats.avgCutSec.toFixed(1)}s` : "—"}</div>
              <p className="mt-1 text-ink-2">
                {stats.agentRuns} clip-agent run{stats.agentRuns === 1 ? "" : "s"}
                {stats.failedRuns ? ` · ${stats.failedRuns} failed (provider or footage limits)` : ""}. Compare cut lengths with how your Shorts perform below.
              </p>
              <p className="mt-2 text-ink-2">
                From projects to your calendar: <b className="text-ink">{scheduled}</b> scheduled · <b className="text-ink">{published}</b> published
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ Icon, label, value, sub }: { Icon: typeof Bot; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-line-soft p-3">
      <div className="flex items-center gap-1.5 text-xs text-ink-2">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      <div className="text-xs text-ink-2">{sub}</div>
    </div>
  );
}
