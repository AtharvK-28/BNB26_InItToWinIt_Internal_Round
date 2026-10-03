import { CAMPAIGNS } from "./data/campaigns";
import type { Campaign, Category, Platform } from "./types";

export interface DealFilters {
  q?: string;
  cat?: Category | "matched" | "fast" | "new";
  platform?: Platform;
  budget?: number;
  pay?: number;
  sort?: "fit" | "pay" | "fast" | "rating";
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): DealFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return {
    q: get("q") || undefined,
    cat: (get("cat") as DealFilters["cat"]) || undefined,
    platform: (get("platform") as Platform) || undefined,
    budget: get("budget") ? Number(get("budget")) : undefined,
    pay: get("pay") ? Number(get("pay")) : undefined,
    sort: (get("sort") as DealFilters["sort"]) || undefined,
  };
}

export function hasFilters(f: DealFilters) {
  return Boolean(f.q || f.cat || f.platform || f.budget || f.pay);
}

export function applyFilters(f: DealFilters, list: Campaign[] = CAMPAIGNS) {
  let out = list.filter((c) => {
    if (f.cat === "matched" && c.fit < 75) return false;
    if (f.cat === "fast" && c.paymentDays > 15) return false;
    if (f.cat === "new" && !c.isNew) return false;
    if (f.cat && !["matched", "fast", "new"].includes(f.cat) && c.category !== f.cat) return false;
    if (f.platform && !c.platforms.includes(f.platform)) return false;
    if (f.budget && c.base < f.budget) return false;
    if (f.pay && c.paymentDays > f.pay) return false;
    if (f.q) {
      const hay = `${c.brand} ${c.title} ${c.category} ${c.description} ${c.platforms.join(" ")}`.toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const sort = f.sort ?? (f.cat === "fast" ? "fast" : "fit");
  out = [...out].sort((a, b) =>
    sort === "pay" ? b.base + b.bonus - (a.base + a.bonus) : sort === "fast" ? a.paymentDays - b.paymentDays : sort === "rating" ? b.rating - a.rating : b.fit - a.fit,
  );
  return out;
}

export function toQuery(f: DealFilters) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
}
