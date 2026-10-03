"use client";

import { useEffect, useState } from "react";
import { computeWorkload } from "../logic/wellbeing";
import { categoryLabel, INBOX_CATEGORIES, STREAMS } from "../data/meta";
import type { AppState } from "../store";
import type { AiSource, CreatorProfile } from "../types";
import { daysUntil, fmtDate, toISODate, today } from "../utils";
import type { ChatMessage, CopilotContext, CreatorBrief, TaskMap, TaskName } from "./schemas";

export interface AiResult<T> {
  data: T;
  source: AiSource;
  note?: string;
}

export async function runAi<T extends TaskName>(task: T, input: TaskMap[T]["input"]): Promise<AiResult<TaskMap[T]["output"]>> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, input }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return res.json();
}

/** Streams the copilot reply, calling onText with the accumulated text. Returns which engine answered. */
export async function streamCopilot(
  messages: ChatMessage[],
  context: CopilotContext,
  onText: (full: string) => void,
  signal?: AbortSignal,
): Promise<AiSource> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Copilot request failed (${res.status})`);
  const source = (res.headers.get("X-AI-Source") as AiSource) ?? "local";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(full);
  }
  return source;
}

let statusCache: { claude: boolean; model: string } | null = null;
let statusPromise: Promise<{ claude: boolean; model: string }> | null = null;

export function useAiStatus() {
  const [status, setStatus] = useState(statusCache);
  useEffect(() => {
    if (statusCache) return;
    statusPromise ??= fetch("/api/ai/status")
      .then((r) => r.json())
      .catch(() => ({ claude: false, model: "local engine" }));
    statusPromise.then((s) => {
      statusCache = s;
      setStatus(s);
    });
  }, []);
  return status;
}

export function creatorBrief(p: CreatorProfile): CreatorBrief {
  return {
    name: p.name,
    handle: p.handle,
    niches: p.niches.map(categoryLabel),
    voice: p.voice,
    bio: p.bio,
    platforms: p.platforms
      .filter((x) => x.connected)
      .map((x) => ({ platform: x.platform, followers: x.followers, avgViews: x.avgViews, engagement: x.engagement })),
  };
}

export function buildCopilotContext(s: Pick<AppState, "profile" | "deals" | "content" | "threads" | "earnings" | "packages" | "bookings">): CopilotContext {
  const w = computeWorkload(s.content, s.deals, s.profile.weeklyCapacityHours);
  const totals = STREAMS.map((st) => ({ label: st.label, v: s.earnings.reduce((a, m) => a + m[st.id], 0) }));
  const ytd = totals.reduce((a, t) => a + t.v, 0);
  const top = [...totals].sort((a, b) => b.v - a.v)[0];
  const sumMonth = (m: AppState["earnings"][number]) => m.deals + m.ads + m.affiliate + m.members + m.products;
  return {
    today: toISODate(today()),
    creator: creatorBrief(s.profile),
    packages: s.packages
      .filter((p) => p.active)
      .map((p) => ({ title: p.title, price: p.price, instantBook: p.instantBook, booked: `${p.bookedThisMonth}/${p.slotsPerMonth} slots booked this month` })),
    bookingRequests: s.bookings
      .filter((b) => b.status === "pending")
      .map((b) => ({
        brand: b.brand,
        package: s.packages.find((p) => p.id === b.packageId)?.title ?? "Package",
        price: b.price,
        hoursLeft: Math.max(0, Math.round(24 - (Date.now() - new Date(b.createdAt).getTime()) / 3_600_000)),
      })),
    reviews: s.deals
      .filter((d) => d.review && d.review.status !== "approved")
      .map((d) => ({
        brand: d.brand,
        status: d.review!.status === "changes" ? "changes requested" : "awaiting brand feedback",
        roundsUsed: d.review!.roundsUsed,
        roundsIncluded: d.review!.roundsIncluded,
        openComments: d.review!.comments.filter((c) => !c.resolved && c.scope !== "praise").map((c) => `${c.text}${c.scope === "out" ? " (OUT OF SCOPE)" : ""}`),
      })),
    deals: s.deals.map((d) => ({
      brand: d.brand,
      campaign: d.campaign,
      stage: d.stage,
      value: d.value,
      dueDate: d.dueDate,
      paymentTerms: d.paymentTerms,
      invoice: d.invoice
        ? {
            number: d.invoice.number,
            status: d.invoice.status !== "paid" && daysUntil(d.invoice.due) < 0 ? "overdue" : d.invoice.status,
            due: fmtDate(d.invoice.due),
          }
        : undefined,
      contractRisk:
        d.contractText && /perpetual|ninety|net ninety/i.test(d.contractText)
          ? "Contains perpetual usage, Net-90 pay-when-paid terms, 90-day broad exclusivity and no kill fee."
          : undefined,
    })),
    upcoming: s.content
      .filter((c) => c.status !== "published" && daysUntil(c.date) >= 0 && daysUntil(c.date) < 7)
      .map((c) => ({ title: c.title, platform: c.platform, date: fmtDate(c.date, { weekday: "short", month: "short", day: "numeric" }), status: c.status, effort: c.effort })),
    workload: {
      hours: w.hours,
      capacity: w.capacity,
      status: w.status,
      restDays: w.restDaysThisWeek,
      busiestDay: w.busiestDay ? fmtDate(w.busiestDay.date, { weekday: "long" }) : undefined,
    },
    earnings: {
      ytd,
      thisMonth: sumMonth(s.earnings[s.earnings.length - 1]),
      lastMonth: sumMonth(s.earnings[s.earnings.length - 2]),
      topStream: top.label,
      topStreamShare: top.v / ytd,
    },
    unreadInbox: s.threads
      .filter((t) => t.unread)
      .map((t) => ({ name: t.org ? `${t.name} (${t.org})` : t.name, category: INBOX_CATEGORIES[t.category].label, summary: t.summary })),
  };
}
