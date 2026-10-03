"use client";

import { useMemo } from "react";
import { Check, Sparkles } from "lucide-react";
import { superCreatorStatus } from "@/lib/logic/superCreator";
import { useApp } from "@/lib/store";
import { cn, fmtDate, toISODate } from "@/lib/utils";

/** Super Creator — the Superhost idea applied to creators: four criteria, evaluated quarterly. */
export function SuperCreatorCard() {
  const deals = useApp((s) => s.deals);
  const threads = useApp((s) => s.threads);
  const status = useMemo(() => superCreatorStatus(deals, threads), [deals, threads]);
  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft">
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#fff0f3] to-white p-6">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-5 text-rausch" /> {status.isSuper ? "You're a Super Creator" : "Super Creator progress"}
          </div>
          <p className="mt-1 text-sm text-ink-2">
            Next evaluation {fmtDate(toISODate(status.next), { month: "long", day: "numeric", year: "numeric" })} · based on the last 12 months
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status.isSuper ? "bg-ink text-white" : "bg-surface-2 text-ink")}>{status.criteria.filter((c) => c.met).length}/4 met</span>
      </div>
      <ul className="grid gap-px bg-line-soft sm:grid-cols-2">
        {status.criteria.map((c) => (
          <li key={c.id} className="bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{c.label}</span>
              {c.met && (
                <span className="flex size-5 items-center justify-center rounded-full bg-ink text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{c.value}</span>
              <span className="text-xs text-ink-2">target {c.target}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-ink" style={{ width: `${c.progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-2">{c.hint}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-line-soft p-5 text-sm">
        <b>Perks:</b> <span className="text-ink-2">a Super Creator badge on your media kit and pitches, priority placement in brand matching, and CreatorCover payouts released within 24 hours of approval.</span>
      </div>
    </div>
  );
}
