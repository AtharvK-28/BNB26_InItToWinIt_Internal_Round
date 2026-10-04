import type { Category, CreatorProfile, Deliverable, Platform } from "../types";

/**
 * Fair-rate model. Industry rule of thumb: sponsorship price ≈ expected views × niche CPM,
 * adjusted for format, engagement, usage rights and exclusivity. Transparent on purpose —
 * every line of the breakdown is shown to the creator.
 */

export const NICHE_CPM: Record<Category, number> = {
  tech: 26,
  finance: 34,
  education: 24,
  beauty: 20,
  fitness: 18,
  gaming: 16,
  food: 15,
  travel: 20,
  fashion: 18,
  wellness: 19,
  music: 18,
  photography: 21,
  parenting: 16,
};

const CATEGORY_AVG_ENGAGEMENT = 0.04;

export type UsageLevel = "organic30" | "organic90" | "paid30" | "paid90" | "perpetual";
export type ExclusivityLevel = "none" | "14" | "30" | "60" | "90";

export const USAGE_OPTIONS: { id: UsageLevel; label: string; mult: number }[] = [
  { id: "organic30", label: "30 days organic", mult: 1 },
  { id: "organic90", label: "90 days organic", mult: 1.12 },
  { id: "paid30", label: "30 days paid ads", mult: 1.3 },
  { id: "paid90", label: "90 days paid ads", mult: 1.55 },
  { id: "perpetual", label: "Perpetual, all media", mult: 2.2 },
];

export const EXCLUSIVITY_OPTIONS: { id: ExclusivityLevel; label: string; mult: number }[] = [
  { id: "none", label: "None", mult: 1 },
  { id: "14", label: "14 days", mult: 1.05 },
  { id: "30", label: "30 days", mult: 1.1 },
  { id: "60", label: "60 days", mult: 1.18 },
  { id: "90", label: "90 days", mult: 1.28 },
];

function stat(c: CreatorProfile, p: Platform) {
  return c.platforms.find((x) => x.platform === p);
}

export function deliverableValue(c: CreatorProfile, d: Deliverable, niche: Category) {
  const cpm = NICHE_CPM[niche];
  const s = stat(c, d.platform);
  const label = d.label.toLowerCase();
  if (!s) return 0;
  const k = s.avgViews / 1000;
  let unit = 0;
  switch (d.platform) {
    case "youtube":
      if (label.includes("short")) unit = k * cpm * 0.12;
      else if (label.includes("integration") || label.includes("segment") || label.includes("mid-roll")) unit = k * cpm;
      else if (label.includes("dedicated") || label.includes("full") || label.includes("video")) unit = k * cpm * 1.9;
      else unit = k * cpm;
      break;
    case "tiktok":
      unit = k * cpm * 0.35 * (label.includes("cross") ? 0.5 : 1);
      break;
    case "instagram":
      unit = k * cpm * (label.includes("stor") ? 0.3 : 0.6);
      break;
    case "newsletter":
      unit = ((s.followers * s.engagement) / 1000) * cpm * 1.5;
      break;
    case "linkedin":
      unit = k * cpm * 0.8;
      break;
    case "x":
      unit = k * cpm * 0.3;
      break;
    case "podcast":
      unit = 500;
      break;
    case "twitch":
      unit = 2000;
      break;
  }
  return unit * d.qty;
}

export interface RateEstimate {
  low: number;
  target: number;
  high: number;
  counter: number;
  lines: { label: string; amount: number }[];
  engagementPremium: number;
  usageMult: number;
  exclusivityMult: number;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

export function estimateRate(
  c: CreatorProfile,
  deliverables: Deliverable[],
  niche: Category,
  usage: UsageLevel = "organic30",
  exclusivity: ExclusivityLevel = "none",
): RateEstimate {
  const lines = deliverables.map((d) => ({
    label: `${d.qty > 1 ? `${d.qty} × ` : ""}${d.label}`,
    amount: round50(deliverableValue(c, d, niche)),
  }));
  const base = lines.reduce((s, l) => s + l.amount, 0);
  const primary = stat(c, deliverables[0]?.platform ?? "youtube");
  const eng = primary?.engagement ?? CATEGORY_AVG_ENGAGEMENT;
  const engagementPremium = Math.min(0.25, Math.max(0, (eng - CATEGORY_AVG_ENGAGEMENT) * 5));
  const usageMult = USAGE_OPTIONS.find((u) => u.id === usage)!.mult;
  const exclusivityMult = EXCLUSIVITY_OPTIONS.find((e) => e.id === exclusivity)!.mult;
  const target = round50(base * (1 + engagementPremium) * usageMult * exclusivityMult);
  return {
    low: round50(target * 0.85),
    target,
    high: round50(target * 1.2),
    counter: Math.ceil((target * 0.95) / 100) * 100,
    lines,
    engagementPremium,
    usageMult,
    exclusivityMult,
  };
}

export function usageFromText(t: string): UsageLevel {
  const s = t.toLowerCase();
  if (s.includes("perpetual")) return "perpetual";
  if (s.includes("paid") && !s.includes("no paid") && !s.includes("paid separately")) return s.includes("90") || s.includes("6 months") ? "paid90" : "paid30";
  if (s.includes("60") || s.includes("90")) return "organic90";
  return "organic30";
}

export function exclusivityFromText(t: string): ExclusivityLevel {
  const s = t.toLowerCase();
  if (s.startsWith("none")) return "none";
  const m = s.match(/(\d+)\s*days/);
  if (!m) return "none";
  const d = Number(m[1]);
  if (d <= 14) return "14";
  if (d <= 30) return "30";
  if (d <= 60) return "60";
  return "90";
}

/** How the offer compares to the fair rate: negative = below. */
export function offerGap(offer: number, target: number) {
  return (offer - target) / target;
}
