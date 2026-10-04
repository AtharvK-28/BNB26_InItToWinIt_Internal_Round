"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { BrandLogo } from "@/components/ui/Media";
import { Sheet } from "@/components/ui/Overlay";
import { PlatformChip } from "@/components/ui/PlatformIcon";
import { STAGES } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { DealStage } from "@/lib/types";
import { cn, fmtDate, money, relDay } from "@/lib/utils";
import { EscrowPill } from "@/components/studio/packages/CreatorCover";
import { ContractTab } from "./ContractTab";
import { EscrowPanel } from "./EscrowPanel";
import { InvoiceTab } from "./InvoiceTab";
import { RateTab } from "./RateTab";
import { ReportTab } from "./ReportTab";
import { ReviewTab } from "./ReviewTab";

export type DealTab = "overview" | "review" | "contract" | "rate" | "invoice" | "report";

export function DealSheet({ id, initialTab = "overview", onClose }: { id: string | null; initialTab?: DealTab; onClose: () => void }) {
  const deal = useApp((s) => s.deals.find((d) => d.id === id));
  const [tab, setTab] = useState<DealTab>(initialTab);
  if (!deal) return null;
  const risky = deal.contractText && /perpetual|ninety/i.test(deal.contractText) && !deal.contractScan;

  return (
    <Sheet
      open={Boolean(deal)}
      onClose={onClose}
      width={620}
      title={
        <span className="flex items-center gap-3">
          <BrandLogo initials={deal.brandInitials} color={deal.brandColor} size={32} className="rounded-lg!" />
          <span className="truncate">{deal.brand}</span>
        </span>
      }
    >
      <div className="px-6 pt-5 pb-10">
        <h2 className="text-[22px] leading-tight font-semibold">{deal.campaign}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
          <span className="font-semibold text-ink">{money(deal.value)}</span>
          {deal.bonus && <span>+ up to {money(deal.bonus)} bonus</span>}
          <PlatformChip platform={deal.platform} />
          {deal.escrow ? <EscrowPill status={deal.escrow.status} amount={deal.escrow.amount} /> : <span>Net-{deal.paymentTerms}</span>}
        </div>

        <div className="no-scrollbar -mx-6 mt-5 overflow-x-auto px-6">
          <Segmented<DealTab>
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { id: "overview", label: "Overview" },
              ...(deal.review ? [{ id: "review" as const, label: <span className="inline-flex items-center gap-1.5">Review {deal.review.status === "changes" && <span className="size-1.5 rounded-full bg-rausch" />}</span> }] : []),
              { id: "contract", label: <span className="inline-flex items-center gap-1.5">Contract {risky && <span className="size-1.5 rounded-full bg-arches" />}</span> },
              { id: "rate", label: "Fair rate" },
              { id: "invoice", label: deal.escrow ? "Payment" : "Invoice" },
              ...(deal.report ? [{ id: "report" as const, label: "Report" }] : []),
            ]}
          />
        </div>

        <div className="mt-6">
          {tab === "overview" && <Overview id={deal.id} onTab={setTab} />}
          {tab === "contract" && <ContractTab deal={deal} />}
          {tab === "rate" && <RateTab deal={deal} />}
          {tab === "review" && <ReviewTab deal={deal} />}
          {tab === "invoice" && (deal.escrow ? <EscrowPanel deal={deal} /> : <InvoiceTab deal={deal} />)}
          {tab === "report" && <ReportTab deal={deal} />}
        </div>
      </div>
    </Sheet>
  );
}

function Overview({ id, onTab }: { id: string; onTab: (t: DealTab) => void }) {
  const deal = useApp((s) => s.deals.find((d) => d.id === id))!;
  const moveDeal = useApp((s) => s.moveDeal);
  const toggle = useApp((s) => s.toggleDeliverable);
  const toast = useUi((s) => s.toast);
  const stageIdx = STAGES.findIndex((s) => s.id === deal.stage);
  const done = deal.deliverables.filter((d) => d.done).length;
  const risky = deal.contractText && /perpetual|ninety/i.test(deal.contractText);

  const next: Partial<Record<DealStage, { label: string; to: DealStage; toast: string }>> = {
    inbound: { label: "Mark as pitched", to: "pitched", toast: "Moved to Pitched." },
    pitched: { label: "They replied — negotiating", to: "negotiating", toast: "Moved to Negotiating." },
    negotiating: { label: "Contract signed", to: "contracted", toast: "Signed! Deadlines added to your calendar." },
    contracted: { label: "Start production", to: "production", toast: "Moved to In production." },
    production: deal.escrow
      ? { label: "Delivered — request approval", to: "invoiced", toast: "Delivered! Funds release when the brand approves (or automatically in 5 days)." }
      : { label: "Delivered — send invoice", to: "invoiced", toast: "Invoice sent. Auto-reminders are on." },
  };
  const n = next[deal.stage];

  return (
    <div className="space-y-7">
      {/* Stage tracker */}
      <div>
        <div className="mb-2 flex justify-between text-xs font-semibold">
          <span>{STAGES[stageIdx].label}</span>
          <span className="text-ink-2">{STAGES[stageIdx].hint}</span>
        </div>
        <div className="flex gap-1">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              title={s.label}
              onClick={() => moveDeal(deal.id, s.id)}
              className={cn("h-1.5 flex-1 rounded-full transition", i <= stageIdx ? "bg-ink" : "bg-line-soft hover:bg-line")}
            />
          ))}
        </div>
      </div>

      {risky && !deal.contractScan && (
        <button onClick={() => onTab("contract")} className="w-full rounded-2xl border border-arches/30 bg-arches-soft p-4 text-left text-sm">
          <b className="text-arches">Contract has red flags.</b> Perpetual usage, Net-90 pay-when-paid and broad exclusivity. Tap to review the redlines before you sign.
        </button>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <Fact label={deal.stage === "invoiced" || deal.stage === "paid" ? "Delivered" : "Due"} value={`${fmtDate(deal.dueDate, { month: "short", day: "numeric" })} · ${relDay(deal.dueDate)}`} />
        <Fact label="Go-live" value={deal.goLive ? fmtDate(deal.goLive, { month: "short", day: "numeric" }) : "—"} />
        {deal.escrow ? (
          <Fact label="Payment" value={deal.escrow.status === "funded" ? `${money(deal.escrow.amount)} held · CreatorCover` : "Released to you"} />
        ) : (
          <Fact label="Payment terms" value={`Net-${deal.paymentTerms}${deal.paymentTerms > 30 ? " · long" : ""}`} warn={deal.paymentTerms > 30} />
        )}
        <Fact
          label="Source"
          value={deal.source === "marketplace" ? "CreatorAI marketplace" : deal.source === "inbox" ? "Detected in inbox" : deal.source === "package" ? "Booked your package" : "Direct"}
        />
      </dl>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Checklist</h3>
          <span className="text-sm text-ink-2">
            {done}/{deal.deliverables.length}
          </span>
        </div>
        <ul className="space-y-1">
          {deal.deliverables.map((d) => (
            <li key={d.id}>
              <button onClick={() => toggle(deal.id, d.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface">
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition", d.done ? "border-ink bg-ink text-white" : "border-[#b0b0b0]")}>
                  {d.done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className={cn(d.done && "text-ink-2 line-through")}>{d.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line-soft p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{deal.contact.name}</div>
            <div className="text-ink-2">{deal.contact.email}</div>
          </div>
          <Link href="/studio/inbox" className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-semibold hover:bg-surface">
            <Mail className="size-4" /> Message
          </Link>
        </div>
        {deal.notes && <p className="mt-3 border-t border-line-soft pt-3 text-ink-2">{deal.notes}</p>}
      </section>

      {deal.pitch && (
        <section>
          <h3 className="mb-2 font-semibold">Your pitch</h3>
          <p className="line-clamp-6 rounded-xl bg-surface p-4 text-sm whitespace-pre-wrap text-ink-2">{deal.pitch}</p>
        </section>
      )}

      {deal.campaignId && (
        <Link href={`/deals/${deal.campaignId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
          View campaign brief <ExternalLink className="size-3.5" />
        </Link>
      )}

      {n && (
        <Button
          variant={deal.stage === "production" ? "rausch" : "dark"}
          size="lg"
          className="w-full"
          onClick={() => {
            moveDeal(deal.id, n.to);
            toast(n.toast);
            if (n.to === "invoiced") onTab("invoice");
          }}
        >
          {n.label}
        </Button>
      )}
      {deal.stage === "invoiced" && (
        <Button variant="dark" size="lg" className="w-full" onClick={() => onTab("invoice")}>
          View invoice & payment status
        </Button>
      )}
    </div>
  );
}

function Fact({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-line-soft p-3">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className={cn("mt-0.5 font-semibold", warn && "text-amber")}>{value}</dd>
    </div>
  );
}
