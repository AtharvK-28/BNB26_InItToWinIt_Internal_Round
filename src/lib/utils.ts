import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function money(n: number, opts: { cents?: boolean; compact?: boolean } = {}) {
  if (opts.compact && Math.abs(n) >= 1000) {
    const v = n / 1000;
    return `$${v >= 100 ? Math.round(v) : v.toFixed(v % 1 === 0 ? 0 : 1)}k`;
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts.cents ? 2 : 0,
    minimumFractionDigits: opts.cents ? 2 : 0,
  });
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

export function pct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`;
}

/* ---------- dates (all app dates are ISO yyyy-mm-dd strings in local time) ---------- */

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysFromNow(n: number) {
  const d = today();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysUntil(iso: string) {
  const ms = fromISODate(iso).getTime() - today().getTime();
  return Math.round(ms / 86_400_000);
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return fromISODate(iso).toLocaleDateString("en-US", opts);
}

export function relDay(iso: string) {
  const n = daysUntil(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return `In ${n} days`;
  if (n < -1 && n > -14) return `${-n} days ago`;
  return fmtDate(iso);
}

export function timeAgo(isoDateTime: string) {
  const diff = (Date.now() - new Date(isoDateTime).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(isoDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic pseudo-random from a string seed — keeps mock data stable between renders. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
