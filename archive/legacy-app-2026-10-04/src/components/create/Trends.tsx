"use client";

import { useState } from "react";
import { Eye, Flame, TrendingUp } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { OUTLIERS, RISING_SEARCHES } from "@/lib/data/growth";
import type { Outlier, Platform } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

type Filter = "all" | "Short" | "Long-form" | "10x";

/**
 * Trend radar — outliers are videos doing 3×+ their own channel's average views
 * (10×+ is a priority signal): proof the topic drove the views, not the channel size.
 */
export function Trends({ onScript, onIdeas }: { onScript: (idea: string, platform: Platform) => void; onIdeas: (prompt: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Outlier | null>(null);
  const list = OUTLIERS.filter((o) => (filter === "all" ? true : filter === "10x" ? o.multiplier >= 10 : o.format === filter)).sort((a, b) => b.multiplier - a.multiplier);

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_340px]">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold">Outliers in your niche</h2>
            <p className="text-sm text-ink-2">Videos your audience also watches that beat their channel&apos;s average by 3× or more.</p>
          </div>
          <div className="flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </Chip>
            <Chip active={filter === "10x"} onClick={() => setFilter("10x")}>
              <Flame className="size-3.5" /> 10×+
            </Chip>
            <Chip active={filter === "Short"} onClick={() => setFilter("Short")}>
              Shorts
            </Chip>
            <Chip active={filter === "Long-form"} onClick={() => setFilter("Long-form")}>
              Long-form
            </Chip>
          </div>
        </div>
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => (
            <button key={o.id} onClick={() => setOpen(o)} className="group text-left">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <Photo k={o.thumb} w={560} h={315} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                <span className={cn("absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-xs font-bold shadow", o.multiplier >= 10 ? "bg-rausch text-white" : "bg-white/95 text-ink")}>
                  {o.multiplier.toFixed(1)}× channel avg
                </span>
                <span className="absolute right-2.5 bottom-2.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">{o.format === "Short" ? "Short" : "Video"}</span>
              </div>
              <div className="mt-2.5 line-clamp-2 text-[15px] leading-5 font-semibold">{o.title}</div>
              <div className="mt-1 text-sm text-ink-2">
                {o.channel} · {compact(o.channelSubs)} subs
              </div>
              <div className="flex items-center gap-1 text-sm text-ink-2">
                <Eye className="size-3.5" /> {compact(o.views)} views · {o.daysAgo}d ago
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside>
        <div className="rounded-2xl border border-line-soft p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="size-4" /> Rising searches
          </h3>
          <p className="mb-4 text-xs text-ink-2">30-day growth in your niche · fictional demo data</p>
          <ul className="divide-y divide-line-soft">
            {RISING_SEARCHES.map((r) => (
              <li key={r.term} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.term}</div>
                  <div className="flex items-center gap-2 text-xs text-ink-2">
                    <span className="font-semibold text-babu">+{Math.round(r.growth * 100)}%</span>
                    <span>{r.volume}</span>
                    <span className={cn("rounded-full px-1.5 py-px font-semibold", r.competition === "Low" ? "bg-babu-soft text-babu" : r.competition === "Medium" ? "bg-amber-soft text-amber" : "bg-surface-2 text-ink-2")}>
                      {r.competition} competition
                    </span>
                  </div>
                </div>
                <button onClick={() => onIdeas(r.term)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-ink">
                  Ideas
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title="Why it's working" width={600}>
        {open && (
          <div className="space-y-5 p-6">
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <Photo k={open.thumb} w={1000} className="absolute inset-0" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{open.title}</h3>
              <p className="text-sm text-ink-2">
                {open.channel} · {compact(open.views)} views · <b className="text-ink">{open.multiplier.toFixed(1)}×</b> the channel&apos;s average
              </p>
            </div>
            <div className="ai-border rounded-2xl p-5 text-[15px]">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <AiSpark className="size-4" /> {open.topic}
              </div>
              {open.why}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="dark"
                className="flex-1"
                onClick={() => {
                  setOpen(null);
                  onScript(`My take: ${open.title.replace(/^I /, "I also ")}`, open.format === "Short" ? "tiktok" : "youtube");
                }}
              >
                Make my version
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOpen(null);
                  onIdeas(open.topic.toLowerCase());
                }}
              >
                Ideas on this topic
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
