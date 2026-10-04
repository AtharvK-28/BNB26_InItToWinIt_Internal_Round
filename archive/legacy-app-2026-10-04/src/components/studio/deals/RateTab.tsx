"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { getCampaign } from "@/lib/data/campaigns";
import { EXCLUSIVITY_OPTIONS, estimateRate, exclusivityFromText, offerGap, USAGE_OPTIONS, usageFromText, type ExclusivityLevel, type UsageLevel } from "@/lib/logic/rate";
import { useApp, useUi } from "@/lib/store";
import type { Deal, Deliverable } from "@/lib/types";
import { cn, money } from "@/lib/utils";

/** Interactive fair-rate calculator for a deal. */
export function RateTab({ deal }: { deal: Deal }) {
  const profile = useApp((s) => s.profile);
  const updateDeal = useApp((s) => s.updateDeal);
  const openCopilot = useUi((s) => s.openCopilot);
  const toast = useUi((s) => s.toast);
  const campaign = deal.campaignId ? getCampaign(deal.campaignId) : undefined;
  const [items, setItems] = useState<Deliverable[]>(
    campaign?.deliverables ?? [{ platform: deal.platform, label: deal.platform === "youtube" ? "60s integration" : "Short video", qty: Math.max(1, Number(deal.campaign.match(/x\s?(\d)|\((?:x)?(\d)\)/i)?.[1] ?? 1)) }],
  );
  const [usage, setUsage] = useState<UsageLevel>(campaign ? usageFromText(campaign.usageRights) : deal.contractText && /perpetual/i.test(deal.contractText) ? "perpetual" : "organic30");
  const [excl, setExcl] = useState<ExclusivityLevel>(campaign ? exclusivityFromText(campaign.exclusivity) : deal.contractText && /ninety \(90\) days/i.test(deal.contractText) ? "90" : "none");
  const rate = useMemo(() => estimateRate(profile, items, deal.category, usage, excl), [profile, items, deal.category, usage, excl]);
  const gap = offerGap(deal.value, rate.target);
  const pos = Math.max(0, Math.min(1, (deal.value - rate.low * 0.7) / (rate.high * 1.15 - rate.low * 0.7)));
  const lowPos = (rate.low - rate.low * 0.7) / (rate.high * 1.15 - rate.low * 0.7);
  const highPos = (rate.high - rate.low * 0.7) / (rate.high * 1.15 - rate.low * 0.7);

  return (
    <div className="space-y-7">
      <div className="rounded-2xl bg-surface p-5">
        <div className="text-sm text-ink-2">Your fair rate for this scope</div>
        <div className="mt-1 text-[32px] font-semibold">{money(rate.target)}</div>
        <div className="relative mt-5 h-2 rounded-full bg-line-soft">
          <div className="absolute h-2 rounded-full bg-babu/30" style={{ left: `${lowPos * 100}%`, width: `${(highPos - lowPos) * 100}%` }} />
          <div className="absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-ink shadow" style={{ left: `${pos * 100}%` }} title="Current offer" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-2">
          <span>Fair range {money(rate.low)} – {money(rate.high)}</span>
          <span>
            Offer <b className="text-ink">{money(deal.value)}</b>{" "}
            <span className={cn("font-semibold", gap < -0.05 ? "text-arches" : "text-babu")}>
              ({gap > 0 ? "+" : ""}
              {Math.round(gap * 100)}%)
            </span>
          </span>
        </div>
      </div>

      <section>
        <h3 className="mb-3 font-semibold">Deliverables</h3>
        <ul className="divide-y divide-line-soft rounded-xl border border-line-soft">
          {items.map((d, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
              <PlatformGlyph platform={d.platform} size={16} />
              <span className="flex-1">{d.label}</span>
              <span className="w-16 text-right text-ink-2">{money(rate.lines[i]?.amount ?? 0)}</span>
              <div className="flex items-center gap-2">
                <button aria-label="Fewer" disabled={d.qty <= 1} onClick={() => setItems((x) => x.map((y, k) => (k === i ? { ...y, qty: y.qty - 1 } : y)))} className="flex size-7 items-center justify-center rounded-full border border-line disabled:opacity-30">
                  <Minus className="size-3" />
                </button>
                <span className="w-4 text-center font-semibold">{d.qty}</span>
                <button aria-label="More" onClick={() => setItems((x) => x.map((y, k) => (k === i ? { ...y, qty: y.qty + 1 } : y)))} className="flex size-7 items-center justify-center rounded-full border border-line">
                  <Plus className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Usage rights</h3>
          <div className="flex flex-wrap gap-2">
            {USAGE_OPTIONS.map((u) => (
              <button key={u.id} onClick={() => setUsage(u.id)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", usage === u.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
                {u.label} {u.mult > 1 && <span className="opacity-60">×{u.mult}</span>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Exclusivity</h3>
          <div className="flex flex-wrap gap-2">
            {EXCLUSIVITY_OPTIONS.map((e) => (
              <button key={e.id} onClick={() => setExcl(e.id)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", excl === e.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
                {e.label} {e.mult > 1 && <span className="opacity-60">×{e.mult}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="flex gap-2 text-sm text-ink-2">
        <AiSpark className="mt-0.5 size-4 shrink-0" />
        Your engagement ({(profile.platforms[0].engagement * 100).toFixed(1)}%) is above the ~4% category average, which adds a {(rate.engagementPremium * 100).toFixed(0)}% premium.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="dark"
          className="flex-1"
          onClick={() => {
            updateDeal(deal.id, { value: rate.counter });
            toast(`Deal value updated to your counter of ${money(rate.counter)}.`);
          }}
        >
          Set deal to {money(rate.counter)}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => openCopilot(`Write a counter-offer email to ${deal.brand} for ${money(rate.counter)} instead of ${money(deal.value)}`)}>
          Draft counter with AI
        </Button>
      </div>
    </div>
  );
}
