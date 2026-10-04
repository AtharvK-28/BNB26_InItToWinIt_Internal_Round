import type { Deal, Thread } from "../types";

/**
 * Super Creator — modeled on Airbnb Superhost's four criteria over the trailing year
 * (rating, response rate, reliability, volume) with quarterly evaluations.
 */
export interface Criterion {
  id: string;
  label: string;
  target: string;
  value: string;
  progress: number; // 0..1
  met: boolean;
  hint: string;
}

export function nextEvaluation(d = new Date()) {
  const quarters = [0, 3, 6, 9].map((m) => new Date(d.getFullYear(), m, 1));
  quarters.push(new Date(d.getFullYear() + 1, 0, 1));
  return quarters.find((q) => q > d)!;
}

/** Trailing-12-month history before the threads currently in the inbox (demo data). */
const HISTORY = { completedDeals: 8, answeredWithin24h: 112, inquiries: 118 };

export function superCreatorStatus(deals: Deal[], threads: Thread[], brandRating = 4.97) {
  const completed = deals.filter((d) => ["invoiced", "paid"].includes(d.stage)).length + HISTORY.completedDeals;
  const onTime = 1; // no late deliverables this year
  // Brand/collab threads still waiting on a first reply after 24h count against the response rate.
  const overdue = threads.filter((t) => {
    if (!["deal", "collab"].includes(t.category) || t.messages.some((m) => m.from === "me")) return false;
    return Date.now() - new Date(t.messages[0].at).getTime() > 24 * 3600_000;
  }).length;
  const answeredNow = threads.filter((t) => ["deal", "collab"].includes(t.category) && t.messages.some((m) => m.from === "me")).length;
  const responseRate = (HISTORY.answeredWithin24h + answeredNow) / (HISTORY.inquiries + answeredNow + overdue);

  const criteria: Criterion[] = [
    { id: "rating", label: "Brand rating", target: "4.8+", value: brandRating.toFixed(2), progress: Math.min(1, brandRating / 4.8), met: brandRating >= 4.8, hint: "Average rating from brands you completed paid deals with." },
    { id: "response", label: "Response rate", target: "90%+ within 24h", value: `${Math.round(responseRate * 100)}%`, progress: Math.min(1, responseRate / 0.9), met: responseRate >= 0.9, hint: "Reply to brand and collab messages within a day — auto-replies count." },
    { id: "ontime", label: "On-time delivery", target: "95%+", value: `${Math.round(onTime * 100)}%`, progress: Math.min(1, onTime / 0.95), met: onTime >= 0.95, hint: "Drafts delivered by the agreed date, no cancellations." },
    { id: "volume", label: "Completed paid deals", target: "5+ a year", value: `${completed}`, progress: Math.min(1, completed / 5), met: completed >= 5, hint: "Paid partnerships delivered in the last 12 months." },
  ];
  return { criteria, isSuper: criteria.every((c) => c.met), next: nextEvaluation() };
}
