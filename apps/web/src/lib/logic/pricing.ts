import type { CreatorProfile, Package } from "../types";
import { estimateRate, exclusivityFromText, usageFromText } from "./rate";

/**
 * Smart pricing for packages (in the spirit of Airbnb Smart Pricing): start from the
 * fair rate, then adjust for season and demand. Q4 ad budgets run hot — YouTube CPMs are
 * widely reported 30–50% above the annual average Oct–Dec — so we suggest a conservative
 * seasonal uplift, plus a demand uplift when slots are nearly full.
 */
export function seasonalFactor(d = new Date()) {
  const m = d.getMonth();
  if (m >= 9) return { factor: 1.15, label: "Q4 holiday demand (+15%)" };
  if (m === 0) return { factor: 0.92, label: "January lull (−8%)" };
  return { factor: 1, label: "Normal season" };
}

export function demandFactor(p: Package) {
  const fill = p.bookedThisMonth / Math.max(1, p.slotsPerMonth);
  if (fill >= 0.75) return { factor: 1.1, label: `${Math.round(fill * 100)}% of slots booked (+10%)` };
  if (fill === 0) return { factor: 0.97, label: "No bookings yet this month (−3%)" };
  return { factor: 1, label: `${Math.round(fill * 100)}% of slots booked` };
}

const round50 = (n: number) => Math.round(n / 50) * 50;

export function suggestPackagePrice(profile: CreatorProfile, p: Package) {
  const base = estimateRate(profile, p.deliverables, p.category, usageFromText(p.usage), exclusivityFromText("none")).target;
  const s = seasonalFactor();
  const dmd = demandFactor(p);
  const smart = round50(base * s.factor * dmd.factor);
  return { base, smart, season: s, demand: dmd };
}

/** Price a brand actually pays today. */
export function livePrice(profile: CreatorProfile, p: Package) {
  return p.smartPricing ? suggestPackagePrice(profile, p).smart : p.price;
}
