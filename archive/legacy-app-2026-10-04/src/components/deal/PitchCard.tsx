"use client";

import { useState } from "react";
import { ChevronDown, Flag, TrendingDown, TrendingUp } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { estimateRate, exclusivityFromText, offerGap, usageFromText } from "@/lib/logic/rate";
import { useApp } from "@/lib/store";
import type { Campaign } from "@/lib/types";
import { cn, daysFromNow, fmtDate, money } from "@/lib/utils";
import { PitchModal } from "./PitchModal";

function useRate(c: Campaign) {
  const profile = useApp((s) => s.profile);
  return estimateRate(profile, c.deliverables, c.category, usageFromText(c.usageRights), exclusivityFromText(c.exclusivity));
}

export function PitchCard({ c }: { c: Campaign }) {
  const [open, setOpen] = useState(false);
  const [showDeliv, setShowDeliv] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const rate = useRate(c);
  const gap = offerGap(c.base, rate.target);
  const estBonus = Math.round((c.bonus * 0.75) / 50) * 50;
  const already = useApp((s) => s.deals.find((d) => d.campaignId === c.id && d.stage !== "paid"));

  return (
    <>
      <div className="rounded-xl border border-line p-6 shadow-card">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-semibold">{money(c.base)}</span>
          <span className="text-ink-2">base</span>
        </div>
        {c.bonus > 0 && <div className="text-sm text-ink-2">+ up to {money(c.bonus)} performance bonus</div>}

        <div className="mt-5 overflow-hidden rounded-lg border border-[#b0b0b0]">
          <div className="grid grid-cols-2">
            <div className="border-r border-[#b0b0b0] px-3 py-2.5">
              <div className="text-[10px] font-bold tracking-wide uppercase">Apply by</div>
              <div className="text-sm" suppressHydrationWarning>{fmtDate(daysFromNow(c.applyByDays), { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
            <div className="px-3 py-2.5">
              <div className="text-[10px] font-bold tracking-wide uppercase">Go-live</div>
              <div className="text-sm" suppressHydrationWarning>{fmtDate(daysFromNow(c.goLiveDays), { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>
          <button onClick={() => setShowDeliv((x) => !x)} className="flex w-full items-center justify-between border-t border-[#b0b0b0] px-3 py-2.5 text-left">
            <span>
              <span className="block text-[10px] font-bold tracking-wide uppercase">Deliverables</span>
              <span className="text-sm">
                {c.deliverables.reduce((s, d) => s + d.qty, 0)} pieces · {c.platforms.length} platform{c.platforms.length > 1 ? "s" : ""}
              </span>
            </span>
            <ChevronDown className={cn("size-4 transition-transform", showDeliv && "rotate-180")} />
          </button>
          {showDeliv && (
            <ul className="space-y-2 border-t border-line-soft px-3 py-3 text-sm">
              {c.deliverables.map((d) => (
                <li key={d.label} className="flex items-center gap-2">
                  <PlatformGlyph platform={d.platform} size={14} />
                  <span className="flex-1">{d.label}</span>
                  <span className="text-ink-2">× {d.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="rausch" size="lg" className="mt-4 w-full" onClick={() => setOpen(true)}>
          {already ? "Update your pitch" : "Pitch with AI"}
        </Button>
        <p className="mt-3 text-center text-sm text-ink-2">{already ? `In your pipeline · ${already.stage}` : "Free to pitch — 0% creator fees"}</p>

        <div className="mt-5 space-y-3 text-[15px]">
          <Row label="Base fee" value={money(c.base)} />
          {c.bonus > 0 && <Row label="Performance bonus (est.)" value={money(estBonus)} hint={c.bonusNote} />}
          <Row label="CreatorAI fee" value={money(0)} />
        </div>
        <div className="mt-5 flex justify-between border-t border-line-soft pt-5 text-[15px] font-semibold">
          <span>You could earn</span>
          <span>{money(c.base + estBonus)}</span>
        </div>
      </div>

      {/* Fair-rate check */}
      <button
        onClick={() => setShowRate(true)}
        className="mt-6 flex w-full items-start gap-4 rounded-xl border border-line p-5 text-left transition hover:shadow-soft"
      >
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", gap < -0.05 ? "bg-amber-soft text-amber" : "bg-babu-soft text-babu")}>
          {gap < -0.05 ? <TrendingDown className="size-5" /> : <TrendingUp className="size-5" />}
        </span>
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <AiSpark className="size-3.5" /> Fair-rate check
          </span>
          <span className="mt-1 block text-ink-2">
            {gap < -0.05 ? (
              <>
                This offer is <b className="text-ink">{Math.round(-gap * 100)}% below</b> your fair rate of <b className="text-ink">{money(rate.target)}</b>. Counter at{" "}
                <b className="text-ink">{money(rate.counter)}</b>.
              </>
            ) : (
              <>
                This offer is <b className="text-ink">at or above</b> your fair rate of <b className="text-ink">{money(rate.target)}</b>. Good deal.
              </>
            )}
          </span>
          <span className="mt-2 block font-semibold underline underline-offset-2">See how we calculated it</span>
        </span>
      </button>

      <button className="mx-auto mt-6 flex items-center gap-2 text-sm text-ink-2 underline underline-offset-2">
        <Flag className="size-3.5" /> Report this brand
      </button>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-line-soft bg-white px-6 py-4 md:hidden">
        <div>
          <div className="font-semibold">{money(c.base)} base</div>
          <div className="text-xs text-ink-2 underline">Pays in {c.paymentDays} days</div>
        </div>
        <Button variant="rausch" size="lg" onClick={() => setOpen(true)}>
          Pitch with AI
        </Button>
      </div>

      <PitchModal open={open} onClose={() => setOpen(false)} c={c} fairRate={rate.target} counter={rate.counter} />

      <Modal open={showRate} onClose={() => setShowRate(false)} title="Your fair rate" width={520}>
        <div className="space-y-5 p-6">
          <p className="text-sm text-ink-2">
            Expected views × niche CPM, adjusted for your engagement, the usage rights and the exclusivity this brand asks for. Every number comes from your connected accounts.
          </p>
          <div className="space-y-3 text-[15px]">
            {rate.lines.map((l) => (
              <Row key={l.label} label={l.label} value={money(l.amount)} />
            ))}
            <Row label={`Engagement premium (${(rate.engagementPremium * 100).toFixed(0)}%)`} value={`× ${(1 + rate.engagementPremium).toFixed(2)}`} />
            <Row label={`Usage: ${c.usageRights.split("·")[0].trim()}`} value={`× ${rate.usageMult.toFixed(2)}`} />
            <Row label={`Exclusivity: ${c.exclusivity.split("·")[0].trim()}`} value={`× ${rate.exclusivityMult.toFixed(2)}`} />
          </div>
          <div className="flex justify-between border-t border-line-soft pt-4 text-[15px] font-semibold">
            <span>Fair rate</span>
            <span>{money(rate.target)}</span>
          </div>
          <div className="rounded-xl bg-surface p-4 text-sm">
            Typical range for creators like you: <b>{money(rate.low)} – {money(rate.high)}</b>. Brand offer: <b>{money(c.base)}</b>.
          </div>
        </div>
      </Modal>
    </>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={cn("text-ink", hint && "underline decoration-dotted underline-offset-4")} title={hint}>
        {label}
      </span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
