import type { Deal, MonthEarnings } from "../types";
import { fromISODate } from "../utils";

const STAGE_PROB: Record<string, number> = { inbound: 0.15, pitched: 0.25, negotiating: 0.55, contracted: 0.95, production: 0.97, invoiced: 0.99 };

export const monthTotal = (m: MonthEarnings) => m.deals + m.ads + m.affiliate + m.members + m.products;

/** When a deal's money should actually land. */
export function expectedPayDate(d: Deal) {
  if (d.invoice && d.invoice.status !== "paid") {
    const due = fromISODate(d.invoice.due);
    return due < new Date() ? new Date() : due;
  }
  const base = fromISODate(d.dueDate);
  base.setDate(base.getDate() + d.paymentTerms);
  return base;
}

/**
 * 3-month cash-flow forecast: recurring streams use the trailing 6-month average;
 * brand deals use expected payment dates weighted by pipeline-stage probability.
 * The band widens each month to reflect real uncertainty.
 */
export function forecast(earnings: MonthEarnings[], deals: Deal[]) {
  const complete = earnings.slice(-7, -1);
  const avg = (k: keyof Omit<MonthEarnings, "month">) => complete.reduce((s, m) => s + m[k], 0) / complete.length;
  const recurring = avg("ads") + avg("affiliate") + avg("members") + avg("products");
  const now = new Date();
  const thisMonth = monthTotal(earnings[earnings.length - 1]);
  return [0, 1, 2].map((k) => {
    const start = new Date(now.getFullYear(), now.getMonth() + k, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + k + 1, 1);
    const dealsIn = deals
      .filter((d) => d.stage !== "paid")
      .map((d) => ({ d, at: expectedPayDate(d) }))
      .filter(({ at }) => (k === 0 ? at >= now : at >= start) && at < end);
    const committed = dealsIn.reduce((s, { d }) => s + d.value * (STAGE_PROB[d.stage] ?? 0.3), 0);
    // The current month is projected to a full month, never below what's already earned.
    const raw = k === 0 ? Math.max(thisMonth + committed, recurring + committed) : recurring + committed;
    const value = Math.round(raw / 50) * 50;
    const spread = 0.12 + k * 0.08;
    return {
      label: start.toLocaleDateString("en-US", { month: "short" }),
      month: start,
      value,
      low: Math.round((value * (1 - spread)) / 50) * 50,
      high: Math.round((value * (1 + spread)) / 50) * 50,
      committed: Math.round(committed),
      recurring: Math.round(recurring),
      deals: dealsIn.map(({ d }) => d.brand),
    };
  });
}
