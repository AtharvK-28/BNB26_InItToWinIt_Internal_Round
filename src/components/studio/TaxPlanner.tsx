"use client";

import { useMemo } from "react";
import { Check, Landmark, Receipt } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Toggle } from "@/components/ui/Controls";
import { taxQuarters } from "@/lib/logic/tax";
import { useApp, useUi } from "@/lib/store";
import { cn, daysUntil, fmtDate, money, toISODate } from "@/lib/utils";

const RATES = [0.22, 0.25, 0.28, 0.32];

/** Quarterly estimated taxes + AI-sorted write-offs (in the spirit of Karat's auto tax planning). */
export function TaxPlanner() {
  const earnings = useApp((s) => s.earnings);
  const rate = useApp((s) => s.taxRate);
  const setRate = useApp((s) => s.setTaxRate);
  const paid = useApp((s) => s.taxPaid);
  const togglePaid = useApp((s) => s.toggleTaxPaid);
  const expenses = useApp((s) => s.expenses);
  const toggleExpense = useApp((s) => s.toggleExpense);
  const toast = useUi((s) => s.toast);
  const quarters = useMemo(() => taxQuarters(earnings, rate), [earnings, rate]);
  const next = quarters.find((q) => !paid.includes(q.id));
  const deductible = expenses.filter((e) => e.deductible).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-line-soft p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Landmark className="size-4" /> Quarterly taxes
            </h2>
            <p className="text-sm text-ink-2">Self-employed creators pay estimated tax four times a year.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1 text-xs font-semibold">
            {RATES.map((r) => (
              <button key={r} onClick={() => setRate(r)} className={cn("rounded-full px-2.5 py-1", rate === r ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-2")}>
                {Math.round(r * 100)}%
              </button>
            ))}
          </div>
        </div>

        {next && (
          <div className="mt-5 rounded-xl bg-surface p-4">
            <div className="text-sm text-ink-2">Next payment · {next.label}</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[28px] font-semibold">{money(next.estimate)}</span>
              <span className="text-sm text-ink-2">
                due {fmtDate(toISODate(next.due), { month: "long", day: "numeric", year: "numeric" })} · in {daysUntil(toISODate(next.due))} days
              </span>
            </div>
          </div>
        )}

        <ol className="mt-5 divide-y divide-line-soft">
          {quarters.map((q) => {
            const isPaid = paid.includes(q.id);
            const days = daysUntil(toISODate(q.due));
            return (
              <li key={q.id} className="flex items-center gap-4 py-3.5">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", isPaid ? "bg-ink text-white" : "border border-line")}>{isPaid ? <Check className="size-3.5" strokeWidth={3} /> : q.label.slice(1, 2)}</span>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold">
                    {q.label} <span className="font-normal text-ink-2">· {q.period}</span>
                  </div>
                  <div className="text-ink-2">
                    Income {money(q.income)} · due {fmtDate(toISODate(q.due), { month: "short", day: "numeric" })}
                    {!isPaid && days < 0 && <span className="font-semibold text-arches"> · overdue</span>}
                  </div>
                </div>
                <span className="w-20 text-right text-sm font-semibold tabular-nums">{money(q.estimate)}</span>
                <button
                  onClick={() => {
                    togglePaid(q.id);
                    if (!isPaid) toast(`${q.label} estimated payment marked as paid.`);
                  }}
                  className={cn("w-[84px] shrink-0 rounded-full border px-3 py-1 text-xs font-semibold", isPaid ? "border-line text-ink-2" : "border-ink")}
                >
                  {isPaid ? "Paid" : "Mark paid"}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-ink-2">US federal schedule. Estimates only — not tax advice; your accountant can confirm the right set-aside rate.</p>
      </div>

      <div className="rounded-2xl border border-line-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-4" /> Write-offs
        </h2>
        <p className="text-sm text-ink-2">Business expenses, sorted by AI from your connected card.</p>
        <div className="mt-4 rounded-xl bg-surface p-4">
          <div className="text-sm text-ink-2">Deductible this month</div>
          <div className="text-[28px] font-semibold">{money(deductible)}</div>
          <div className="flex items-center gap-1.5 text-xs text-ink-2">
            <AiSpark className="size-3" /> Could lower your tax bill by about {money(deductible * rate)}
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line-soft">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{e.merchant}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-px text-[11px] font-semibold", e.category === "Personal" ? "bg-surface-2 text-ink-2" : "bg-sky-soft text-sky")}>{e.category}</span>
                </div>
                <div className="truncate text-xs text-ink-2">{e.aiNote}</div>
              </div>
              <span className={cn("w-16 text-right tabular-nums", !e.deductible && "text-ink-3 line-through")}>{money(e.amount)}</span>
              <Toggle size="sm" on={e.deductible} onChange={() => toggleExpense(e.id)} label={`Deductible: ${e.merchant}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
