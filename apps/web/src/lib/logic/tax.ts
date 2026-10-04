import type { MonthEarnings } from "../types";
import { monthTotal } from "./forecast";

/**
 * US quarterly estimated taxes for self-employed creators. The IRS periods are uneven:
 * Jan–Mar (due Apr 15), Apr–May (due Jun 15), Jun–Aug (due Sep 15), Sep–Dec (due Jan 15).
 * Estimates only — not tax advice.
 */
export interface TaxQuarter {
  id: string;
  label: string;
  period: string;
  due: Date;
  income: number;
  estimate: number;
}

const PERIODS = [
  { id: "q1", label: "Q1", months: [0, 1, 2], period: "Jan – Mar", due: (y: number) => new Date(y, 3, 15) },
  { id: "q2", label: "Q2", months: [3, 4], period: "Apr – May", due: (y: number) => new Date(y, 5, 15) },
  { id: "q3", label: "Q3", months: [5, 6, 7], period: "Jun – Aug", due: (y: number) => new Date(y, 8, 15) },
  { id: "q4", label: "Q4", months: [8, 9, 10, 11], period: "Sep – Dec", due: (y: number) => new Date(y + 1, 0, 15) },
];

export function taxQuarters(earnings: MonthEarnings[], rate: number, year = new Date().getFullYear()): TaxQuarter[] {
  const byMonth = new Map(earnings.map((m) => [m.month, monthTotal(m)]));
  const avg = earnings.reduce((s, m) => s + monthTotal(m), 0) / earnings.length;
  return PERIODS.map((p) => {
    const income = p.months.reduce((s, m) => {
      const key = `${year}-${String(m + 1).padStart(2, "0")}`;
      // Months not yet earned are projected at the trailing average.
      return s + (byMonth.get(key) ?? (new Date(year, m, 1) > new Date() ? avg : 0));
    }, 0);
    return { id: `${year}-${p.id}`, label: `${p.label} ${year}`, period: p.period, due: p.due(year), income: Math.round(income), estimate: Math.round((income * rate) / 10) * 10 };
  });
}
