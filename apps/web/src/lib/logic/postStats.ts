import type { ImportedPost, Platform } from "../types";

/** Splits CSV text into rows, honouring quoted fields with commas, quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

/** Header names used by YouTube Studio, Meta Business Suite, TikTok and LinkedIn exports. */
const COLUMNS = {
  title: ["video title", "title", "post title", "content", "description", "caption", "post", "name"],
  platform: ["platform", "network", "channel", "source"],
  published: ["video publish time", "publish time", "published", "publish date", "date", "posted", "post time", "created", "time"],
  views: ["views", "video views", "plays", "reach", "impressions"],
  likes: ["likes", "reactions"],
  comments: ["comments added", "comments"],
  shares: ["shares", "reposts"],
};

const PLATFORM_WORDS: [Platform, RegExp][] = [
  ["youtube", /youtube|yt/i],
  ["tiktok", /tiktok/i],
  ["instagram", /instagram|ig|reel/i],
  ["linkedin", /linkedin/i],
  ["x", /^x$|twitter/i],
];

const number = (v: string | undefined) => {
  const n = Number((v ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export interface ParsedStats {
  posts: ImportedPost[];
  /** Which recognised columns were found, for the import preview. */
  found: string[];
  skipped: number;
}

/** Reads a stats CSV into posts. Rows without a title or any views (e.g. a "Total" row) are skipped. */
export function readStats(text: string, fallback: Platform): ParsedStats {
  const [header, ...rows] = parseCsv(text);
  if (!header) return { posts: [], found: [], skipped: 0 };
  const names = header.map((h) => h.trim().toLowerCase());
  const col = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, options]) => [key, options.map((o) => names.indexOf(o)).find((i) => i >= 0) ?? -1]),
  ) as Record<keyof typeof COLUMNS, number>;
  const posts: ImportedPost[] = [];
  let skipped = 0;
  rows.forEach((r, k) => {
    const title = (r[col.title] ?? "").trim();
    const views = number(r[col.views]);
    const when = new Date((r[col.published] ?? "").trim());
    if (!title || /^total$/i.test(title) || !views) {
      skipped++;
      return;
    }
    const raw = (r[col.platform] ?? "").trim();
    const stamp = (r[col.published] ?? "").trim();
    posts.push({
      id: `imp-${k}`,
      title: title.slice(0, 140),
      platform: PLATFORM_WORDS.find(([, re]) => re.test(raw))?.[0] ?? fallback,
      published: Number.isNaN(+when) ? "" : when.toISOString(),
      hasTime: !Number.isNaN(+when) && /\d{1,2}:\d{2}/.test(stamp),
      views,
      likes: number(r[col.likes]),
      comments: number(r[col.comments]),
      shares: number(r[col.shares]),
    });
  });
  return { posts, found: Object.entries(col).filter(([, i]) => i >= 0).map(([k]) => k), skipped };
}

export const engagement = (p: ImportedPost) => (p.views ? (p.likes + p.comments + p.shares) / p.views : 0);

/** Posts ranked by views against the creator's own average. */
export function topPosts(posts: ImportedPost[], count = 6) {
  const avg = posts.reduce((s, p) => s + p.views, 0) / Math.max(1, posts.length);
  return [...posts]
    .map((p) => ({ ...p, vsAvg: avg ? p.views / avg : 0 }))
    .sort((a, b) => b.vsAvg - a.vsAvg)
    .slice(0, count);
}

const BUCKETS = [6, 9, 12, 15, 18, 21];

/**
 * Average views by weekday (rows, Mon–Sun) and 3-hour slot (cols, 6a–9p), normalised to 0–1.
 * Null when the export has no posting hours (date-only exports can't place a time slot).
 */
export function bestTimes(posts: ImportedPost[]): number[][] | null {
  const timed = posts.filter((p) => p.published && p.hasTime);
  if (timed.length < 5) return null;
  const sum = [...Array(7)].map(() => Array(6).fill(0));
  const n = [...Array(7)].map(() => Array(6).fill(0));
  for (const p of timed) {
    const d = new Date(p.published);
    const row = (d.getDay() + 6) % 7;
    const h = d.getHours();
    // Late night (before 6am) counts toward the 9pm slot.
    let col = 5;
    for (let k = BUCKETS.length - 1; k >= 0; k--)
      if (h >= BUCKETS[k]) {
        col = k;
        break;
      }
    sum[row][col] += p.views;
    n[row][col] += 1;
  }
  const avg = sum.map((r, i) => r.map((v, j) => (n[i][j] ? v / n[i][j] : 0)));
  const max = Math.max(...avg.flat());
  return max ? avg.map((r) => r.map((v) => v / max)) : null;
}
