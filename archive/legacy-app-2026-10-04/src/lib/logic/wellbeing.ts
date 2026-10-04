import type { ContentItem, Deal } from "../types";
import { daysUntil, fromISODate, toISODate, today } from "../utils";

export interface Workload {
  hours: number;
  capacity: number;
  ratio: number;
  status: "light" | "balanced" | "heavy" | "overloaded";
  perDay: { date: string; hours: number }[];
  streak: number;
  restDaysThisWeek: number;
  busiestDay?: { date: string; hours: number };
}

/** Planned hours over the next 7 days vs. the creator's weekly capacity. */
export function computeWorkload(content: ContentItem[], deals: Deal[], capacity: number): Workload {
  const perDay: { date: string; hours: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = today();
    d.setDate(d.getDate() + i);
    perDay.push({ date: toISODate(d), hours: 0 });
  }
  for (const c of content) {
    if (c.status === "published") continue;
    const slot = perDay.find((p) => p.date === c.date);
    if (slot) slot.hours += c.effort;
  }
  // Admin overhead per active deal (emails, revisions, invoicing)
  const active = deals.filter((d) => ["negotiating", "contracted", "production"].includes(d.stage));
  perDay.forEach((p) => (p.hours += active.length * 0.3));
  const hours = perDay.reduce((s, p) => s + p.hours, 0);
  const ratio = hours / capacity;
  const status = ratio < 0.5 ? "light" : ratio < 0.9 ? "balanced" : ratio < 1.1 ? "heavy" : "overloaded";

  // Posting streak: consecutive days up to today with a published item
  const published = new Set(content.filter((c) => c.status === "published" || (c.status === "scheduled" && daysUntil(c.date) === 0)).map((c) => c.date));
  let streak = 0;
  const cursor = today();
  for (let i = 0; i < 60; i++) {
    if (published.has(toISODate(cursor))) streak++;
    else if (i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  const restDaysThisWeek = perDay.filter((p) => p.hours < 1).length;
  const busiestDay = [...perDay].sort((a, b) => b.hours - a.hours)[0];
  return { hours, capacity, ratio, status, perDay, streak, restDaysThisWeek, busiestDay };
}

export function dayLabel(iso: string) {
  return fromISODate(iso).toLocaleDateString("en-US", { weekday: "short" });
}
