"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, FolderOpen, HardDrive, Mic, Search, Send, Sparkles, Timer } from "lucide-react";
import { Chip } from "@/components/ui/Controls";
import { api, apiDate, assetKindLabel, durationLabel, mediaUrl, updatedLabel, type Asset, type AssetKind, type MediaLinks, type Project } from "@/lib/video/api";
import { type Clip, type Delivery, type Evidence, type Preset, presets } from "@/lib/video/runs";
import { cn } from "@/lib/utils";
import { AssetIcon } from "./AssetIcon";
import { ApiNotice } from "./Chrome";

type Item =
  | { kind: "asset"; id: string; project: Project; asset: Asset; date: string }
  | { kind: "export"; id: string; project: Project; delivery: Delivery; clip?: Clip; date: string };

/** Searchable text for one item: what was said and seen (from the footage index), copy, document text. */
type Passage = { text: string; label: string; icon: "said" | "seen" | "summary" | "copy" | "doc"; time?: number };
type Filter = "all" | AssetKind | "export";

const STOP = new Set(
  "about after again their there these those which while would could should really thing things because before being video little going right where other every first still think people maybe actually something".split(" "),
);

/** The few most repeated meaningful words across an item's passages — light-weight topics. */
function topics(passages: Passage[]) {
  const counts = new Map<string, number>();
  for (const p of passages)
    for (const w of p.text.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? []) if (!STOP.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
}

/** Every file and export across projects — searchable by what's actually in the footage. */
export function Library() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState<Record<string, Passage[]>>({});
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    (async () => {
      const projects = await api<Project[]>("/projects", { signal });
      const per = await Promise.all(
        projects.map(async (p) => {
          const [assets, exports, clips] = await Promise.all([
            api<Asset[]>(`/projects/${p.id}/assets`, { signal }),
            api<Delivery[]>(`/projects/${p.id}/exports`, { signal }),
            api<Clip[]>(`/projects/${p.id}/clips`, { signal }),
          ]);
          return [
            ...assets.map((a): Item => ({ kind: "asset", id: a.id, project: p, asset: a, date: a.created_at })),
            ...exports.map((d): Item => ({ kind: "export", id: d.id, project: p, delivery: d, clip: clips.find((c) => c.id === d.clip_id), date: d.created_at })),
          ];
        }),
      );
      const all = per.flat().sort((a, b) => +apiDate(b.date) - +apiDate(a.date));
      setItems(all);
      setError("");

      // Second pass: the footage index (transcript, visuals) and text documents make everything searchable.
      setIndexing(true);
      const entries = await Promise.all(
        all.map(async (item): Promise<[string, Passage[]]> => {
          if (item.kind === "export") {
            const d = item.clip?.document;
            const copy = d ? [d.title, d.hook, d.caption, ...Object.values(d.platform_captions ?? {})].filter(Boolean).join(" · ") : "";
            return [item.id, copy ? [{ text: copy, label: "Post copy", icon: "copy" }] : []];
          }
          const a = item.asset;
          try {
            if (a.kind === "video") {
              const result = await api<{ ready: boolean; data: Evidence | null }>(`/assets/${a.id}/analysis`, { signal });
              if (!result.ready || !result.data) return [item.id, []];
              return [
                item.id,
                [
                  { text: result.data.summary, label: "Summary", icon: "summary" },
                  ...result.data.transcript.map((s): Passage => ({ text: s.text, label: `Said at ${durationLabel(s.start)}`, icon: "said", time: s.start })),
                  ...result.data.visuals.map((v): Passage => ({ text: v.description, label: `Seen at ${durationLabel(v.time)}`, icon: "seen", time: v.time })),
                ],
              ];
            }
            if (a.kind === "document" && a.codec === "text" && a.bytes < 200_000) {
              const links = await api<MediaLinks>(`/assets/${a.id}/links`, { signal });
              const text = await fetch(mediaUrl(links.original), { signal }).then((r) => (r.ok ? r.text() : ""));
              return [item.id, text ? text.split(/\n{2,}/).map((t): Passage => ({ text: t.trim(), label: "In the document", icon: "doc" })) : []];
            }
          } catch {
            /* an item without an index is still findable by name */
          }
          return [item.id, []];
        }),
      );
      setIndex(Object.fromEntries(entries));
      setIndexing(false);
    })().catch((e: Error) => {
      setIndexing(false);
      if (e.name !== "AbortError") setError(e.message);
    });
    return () => controller.abort();
  }, [attempt]);

  const stats = useMemo(() => {
    const assets = (items ?? []).filter((i): i is Extract<Item, { kind: "asset" }> => i.kind === "asset");
    const exports = (items ?? []).filter((i): i is Extract<Item, { kind: "export" }> => i.kind === "export");
    const videos = assets.filter((i) => i.asset.kind === "video");
    return {
      files: assets.length,
      exports: exports.length,
      minutes: videos.reduce((s, i) => s + i.asset.duration, 0) / 60,
      understood: videos.filter((i) => (index[i.id] ?? []).length > 0).length,
      videos: videos.length,
      mb: [...assets.map((i) => i.asset.bytes), ...exports.map((i) => i.delivery.bytes)].reduce((s, b) => s + b, 0) / 1024 / 1024,
    };
  }, [items, index]);

  // Topics come from the footage index only (what is said and shown), not from post copy or files.
  const allTopics = useMemo(() => topics(Object.values(index).flat().filter((p) => p.icon === "said" || p.icon === "seen" || p.icon === "summary")).slice(0, 10), [index]);

  if (error) return <ApiNotice error={error} retry={() => setAttempt((v) => v + 1)} />;

  const q = query.trim().toLowerCase();
  const kindOf = (i: Item): Filter => (i.kind === "export" ? "export" : i.asset.kind);
  const results = (items ?? [])
    .filter((i) => filter === "all" || kindOf(i) === filter)
    .map((i) => {
      if (!q) return { item: i, match: undefined as Passage | undefined };
      const name = `${i.project.title} ${i.kind === "asset" ? `${i.asset.filename} ${assetKindLabel[i.asset.kind]}` : `${i.clip?.document.title ?? ""} ${presets[i.delivery.preset as Preset] ?? ""}`}`.toLowerCase();
      const match = (index[i.id] ?? []).find((p) => p.text.toLowerCase().includes(q));
      return name.includes(q) || match ? { item: i, match } : null;
    })
    .filter((r): r is { item: Item; match: Passage | undefined } => Boolean(r));
  const counts = (items ?? []).reduce<Record<string, number>>((c, i) => ({ ...c, [kindOf(i)]: (c[kindOf(i)] ?? 0) + 1 }), {});

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat Icon={FolderOpen} label="Files" value={items ? `${stats.files}` : "—"} />
        <Stat Icon={Timer} label="Footage" value={items ? `${stats.minutes.toFixed(1)} min` : "—"} sub={items && stats.videos ? `${stats.understood} of ${stats.videos} videos searchable by content` : undefined} />
        <Stat Icon={Send} label="Exports" value={items ? `${stats.exports}` : "—"} />
        <Stat Icon={HardDrive} label="Stored" value={items ? `${stats.mb.toFixed(1)} MB` : "—"} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-line px-5 shadow-search sm:max-w-md">
          <Search className="size-4 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search what's said or shown, file names, captions…" className="w-full bg-transparent text-sm outline-none" />
          {indexing && <span className="shrink-0 text-xs text-ink-2">Indexing…</span>}
        </label>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
        {(["video", "image", "audio", "document", "export"] as Filter[])
          .filter((k) => counts[k])
          .map((k) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
              {k === "export" ? "Exports" : assetKindLabel[k as AssetKind]} · {counts[k]}
            </Chip>
          ))}
      </div>
      {allTopics.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-ink-2">
            <Sparkles className="size-3.5" /> Topics in your footage:
          </span>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setQuery(t)} className={cn("rounded-full border px-3 py-1 text-[13px] transition", q === t ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
              {t}
            </button>
          ))}
        </div>
      )}
      {!items ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-video rounded-2xl" />
          ))}
        </div>
      ) : results.length ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {results.map(({ item, match }) => (
            <LibraryCard key={`${item.kind}-${item.id}`} item={item} match={match} understood={item.kind === "asset" && item.asset.kind === "video" && (index[item.id] ?? []).length > 0} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center">
          <FolderOpen className="size-8 text-ink-2" strokeWidth={1.4} />
          <h3 className="mt-3 text-xl font-semibold">{items.length ? "Nothing matches that search" : "Your library is empty"}</h3>
          <p className="mt-2 max-w-md text-ink-2">
            {items.length ? "Footage becomes searchable by what's said and shown once the agent has understood it (Cuts → Just understand the footage)." : "Footage, images, audio and documents you add to projects — and every export — appear here."}
          </p>
        </div>
      )}
    </>
  );
}

function LibraryCard({ item, match, understood }: { item: Item; match?: Passage; understood: boolean }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    if (item.kind === "asset") {
      if (item.asset.kind !== "document")
        api<MediaLinks>(`/assets/${item.asset.id}/links`, { signal: controller.signal })
          .then((l) => setThumb(mediaUrl(l.thumbnail)))
          .catch(() => {});
    }
    // Exports have no still; the first frames of the rendered MP4 stand in.
    else
      api<{ video: string }>(`/exports/${item.id}/links`, { signal: controller.signal })
        .then((l) => setVideo(`${mediaUrl(l.video)}#t=0.5`))
        .catch(() => {});
    return () => controller.abort();
  }, [item]);
  const href = `/studio/projects/${item.project.id}/${item.kind === "asset" ? "material" : "deliver"}`;
  const badge = item.kind === "asset" ? assetKindLabel[item.asset.kind] : (presets[item.delivery.preset as Preset] ?? "Export");
  const duration = item.kind === "asset" ? (item.asset.kind === "video" || item.asset.kind === "audio" ? item.asset.duration : 0) : item.delivery.duration;
  const name = item.kind === "asset" ? item.asset.filename : `${item.clip?.document.title ?? "Exported cut"} · r${item.delivery.clip_revision}`;
  const MatchIcon = match?.icon === "seen" ? Eye : match?.icon === "said" ? Mic : Sparkles;
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : video ? (
          <video src={video} muted playsInline preload="metadata" className="size-full bg-ink object-contain" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#fff0f3] to-[#ebebeb] text-ink-3">
            {item.kind === "asset" ? <AssetIcon kind={item.asset.kind} className="size-7" /> : <Send className="size-7" />}
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold shadow">{badge}</span>
        {understood && (
          <span className="ai-bg absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" title="Searchable by what's said and shown">
            <Sparkles className="size-3" /> Understood
          </span>
        )}
        {duration > 0 && <span className="absolute right-2.5 bottom-2.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">{durationLabel(duration)}</span>}
      </div>
      <div className="mt-2.5 truncate text-[15px] font-semibold">{name}</div>
      <div className="truncate text-sm text-ink-2">
        {item.project.title} · {updatedLabel(item.date)}
      </div>
      {match && (
        <div className="mt-2 rounded-xl bg-surface p-2.5 text-[13px]">
          <div className="flex items-center gap-1 text-xs font-semibold text-ink-2">
            <MatchIcon className="size-3.5" /> {match.label}
          </div>
          <p className="mt-0.5 line-clamp-2">“{match.text}”</p>
        </div>
      )}
    </Link>
  );
}

function Stat({ Icon, label, value, sub }: { Icon: typeof FolderOpen; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line-soft p-4">
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-2">{sub}</div>}
    </div>
  );
}
