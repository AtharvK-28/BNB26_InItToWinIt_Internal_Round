"use client";

import { useState } from "react";
import { BellRing, CircleCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Controls";
import { LogoMark } from "@/components/ui/Logo";
import { ReminderModal } from "@/components/studio/ReminderModal";
import { useApp, useUi } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { daysFromNow, daysUntil, fmtDate, money, toISODate, today } from "@/lib/utils";

export function InvoiceTab({ deal }: { deal: Deal }) {
  const profile = useApp((s) => s.profile);
  const sendInvoice = useApp((s) => s.sendInvoice);
  const markPaid = useApp((s) => s.markPaid);
  const toast = useUi((s) => s.toast);
  const [remind, setRemind] = useState(false);
  const inv = deal.invoice;
  const overdue = inv && inv.status !== "paid" && daysUntil(inv.due) < 0;
  const number = inv?.number ?? "INV-DRAFT";
  const issued = inv?.issued ?? toISODate(today());
  const due = inv?.due ?? daysFromNow(deal.paymentTerms);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Invoice</h3>
        {inv ? (
          inv.status === "paid" ? (
            <Pill tone="good">
              <CircleCheck className="size-3" /> Paid {inv.paidOn && fmtDate(inv.paidOn)}
            </Pill>
          ) : overdue ? (
            <Pill tone="bad">{-daysUntil(inv.due)} days overdue</Pill>
          ) : (
            <Pill tone="info">Sent · due {fmtDate(inv.due)}</Pill>
          )
        ) : (
          <Pill>Draft</Pill>
        )}
      </div>

      <div className="rounded-2xl border border-line p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <LogoMark size={28} />
            <div className="mt-3 text-sm font-semibold">{profile.name}</div>
            <div className="text-xs text-ink-2">@{profile.handle} · {profile.location}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{number}</div>
            <div className="text-xs text-ink-2">Issued {fmtDate(issued, { month: "short", day: "numeric", year: "numeric" })}</div>
            <div className="text-xs text-ink-2">Due {fmtDate(due, { month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>
        <div className="mt-6 text-xs text-ink-2">Bill to</div>
        <div className="text-sm font-semibold">{deal.brand}</div>
        <div className="text-xs text-ink-2">
          Attn: {deal.contact.name} · {deal.contact.email}
        </div>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left text-xs text-ink-2">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line-soft">
              <td className="py-3">
                {deal.campaign}
                <div className="text-xs text-ink-2">{deal.deliverables.map((d) => d.label).join(" · ")}</div>
              </td>
              <td className="py-3 text-right tabular-nums">{money(deal.value)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 flex justify-between text-base font-semibold">
          <span>Total due</span>
          <span>{money(deal.value)}</span>
        </div>
        <p className="mt-5 rounded-lg bg-surface p-3 text-xs text-ink-2">
          Payment terms: Net-{deal.paymentTerms}. Late payments accrue {inv?.lateFeePct ?? 1.5}% interest per month. Pay by bank transfer or card via the CreatorAI payment link.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {!inv && (
          <Button
            variant="rausch"
            className="flex-1"
            onClick={() => {
              sendInvoice(deal.id);
              toast(`Invoice sent to ${deal.contact.email}. Auto-reminders are on.`);
            }}
          >
            <Send className="size-4" /> Send invoice
          </Button>
        )}
        {inv && inv.status !== "paid" && (
          <>
            <Button variant={overdue ? "rausch" : "outline"} className="flex-1" onClick={() => setRemind(true)}>
              <BellRing className="size-4" /> {overdue ? "Send AI reminder" : "Send a nudge"}
            </Button>
            <Button
              variant="dark"
              className="flex-1"
              onClick={() => {
                markPaid(deal.id);
                toast(`${money(deal.value)} from ${deal.brand} marked as paid. 🎉`);
              }}
            >
              <CircleCheck className="size-4" /> Mark as paid
            </Button>
          </>
        )}
      </div>
      {inv && inv.status !== "paid" && (
        <p className="text-xs text-ink-2">
          Auto-reminders: friendly nudge 3 days before due → reminder on the due date → firm follow-up at +7 days. {inv.remindersSent} sent so far.
        </p>
      )}
      <ReminderModal deal={remind ? deal : null} onClose={() => setRemind(false)} />
    </div>
  );
}
