"use client";

import { Check } from "lucide-react";
import { CreatorCoverMark } from "@/components/studio/packages/CreatorCover";
import { Button } from "@/components/ui/Button";
import { useApp, useUi } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { cn, fmtDate, money } from "@/lib/utils";

/** Payment status for prepaid (CreatorCover) deals — replaces invoices and reminders. */
export function EscrowPanel({ deal }: { deal: Deal }) {
  const release = useApp((s) => s.releaseEscrow);
  const toast = useUi((s) => s.toast);
  const e = deal.escrow!;
  const delivered = ["invoiced", "paid"].includes(deal.stage);
  const steps = [
    { label: "Brand paid in full", sub: fmtDate(e.fundedOn, { month: "short", day: "numeric" }), done: true },
    { label: "You deliver the content", sub: delivered ? "Delivered" : `Due ${fmtDate(deal.dueDate, { month: "short", day: "numeric" })}`, done: delivered },
    { label: "Brand approves", sub: `or auto-release ${e.autoReleaseDays} days after delivery`, done: e.status === "released" },
    { label: "Money in your account", sub: e.status === "released" ? "Paid" : "Within 1 business day of release", done: e.status === "released" },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line-soft p-5">
        <CreatorCoverMark small />
        <div className="mt-3 text-[32px] font-semibold">{money(e.amount)}</div>
        <div className="text-sm text-ink-2">{e.status === "funded" ? "Held safely for you — no invoice, no chasing." : "Released to you."}</div>
        <ol className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex gap-3">
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-ink text-white" : "border border-line text-ink-2")}>
                {s.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="text-sm">
                <span className="block font-semibold">{s.label}</span>
                <span className="text-ink-2">{s.sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      {e.status === "funded" && delivered && (
        <Button
          variant="dark"
          className="w-full"
          onClick={() => {
            release(deal.id);
            toast(`${deal.brand} approved — ${money(e.amount)} released to you. 🎉`);
          }}
        >
          Simulate brand approval & release
        </Button>
      )}
      <p className="text-xs text-ink-2">If {deal.brand} cancels after you&apos;ve started, CreatorCover pays your kill fee from the held funds.</p>
    </div>
  );
}
