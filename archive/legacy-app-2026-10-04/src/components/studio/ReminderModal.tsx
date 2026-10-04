"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Deal } from "@/lib/types";
import { daysUntil, fmtDate, money } from "@/lib/utils";

/** AI-drafted payment reminder; tone escalates with each reminder already sent. */
export function ReminderModal({ deal, onClose }: { deal: Deal | null; onClose: () => void }) {
  if (!deal?.invoice) return null;
  return <ReminderDraft key={deal.id} deal={deal} onClose={onClose} />;
}

function ReminderDraft({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const sendReminder = useApp((s) => s.sendReminder);
  const toast = useUi((s) => s.toast);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(true);

  const load = (d: Deal, alive: () => boolean = () => true) => {
    const inv = d.invoice!;
    return runAi("reminder", {
      creator: creatorBrief(profile),
      brand: d.brand,
      contact: d.contact.name,
      invoiceNumber: inv.number,
      amount: d.value,
      dueDate: fmtDate(inv.due, { month: "long", day: "numeric" }),
      daysOverdue: Math.max(0, -daysUntil(inv.due)),
      remindersSent: inv.remindersSent,
      lateFeePct: inv.lateFeePct,
    })
      .then((res) => {
        if (!alive()) return;
        setDraft(res.data);
        setSource(res.source);
      })
      .catch(() => alive() && toast("Couldn't draft the reminder — try again."))
      .finally(() => alive() && setLoading(false));
  };

  const generate = (d: Deal) => {
    setLoading(true);
    load(d);
  };

  useEffect(() => {
    let alive = true;
    load(deal, () => alive);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invoice = deal.invoice!;
  const overdue = -daysUntil(invoice.due);
  return (
    <Modal
      open
      onClose={onClose}
      title="Payment reminder"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-2">To {deal.contact.email}</span>
          <Button
            variant="rausch"
            disabled={!draft}
            onClick={() => {
              if (!draft) return;
              sendReminder(deal.id, `${draft.subject}\n\n${draft.body}`);
              toast(`Reminder sent to ${deal.brand}. We'll follow up automatically in 5 days.`);
              onClose();
            }}
          >
            Send reminder
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
          <BrandLogo initials={deal.brandInitials} color={deal.brandColor} size={44} />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">
              {invoice.number} · {money(deal.value)}
            </div>
            <div className="text-ink-2">
              {overdue > 0 ? `${overdue} days overdue` : `Due ${fmtDate(invoice.due)}`} · {invoice.remindersSent} reminder{invoice.remindersSent === 1 ? "" : "s"} sent
            </div>
          </div>
          {overdue > 0 && (
            <div className="text-right text-xs text-ink-2">
              Late fee accrued
              <div className="text-sm font-semibold text-ink">{money(deal.value * (invoice.lateFeePct / 100) * (overdue / 30), { cents: true })}</div>
            </div>
          )}
        </div>
        {loading || !draft ? (
          <div className="space-y-3 rounded-2xl border border-line-soft p-5">
            <AiThinking label="Drafting a reminder in your voice" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
          </div>
        ) : (
          <div className="rounded-2xl border border-line">
            <input
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              className="w-full border-b border-line-soft bg-transparent px-4 py-3 text-sm font-semibold outline-none"
            />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={9}
              className="thin-scrollbar block w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none"
            />
            <div className="flex items-center justify-between border-t border-line-soft px-4 py-2.5">
              <SourceBadge source={source} />
              <button onClick={() => generate(deal)} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
                <RotateCcw className="size-3.5" /> Rewrite
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-ink-2">
          Tone escalates automatically: friendly → firm (mentions your {invoice.lateFeePct}% late fee) → final notice.
        </p>
      </div>
    </Modal>
  );
}
