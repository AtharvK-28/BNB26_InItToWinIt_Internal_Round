"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarClock, MessageSquareText, ChevronRight, CircleDollarSign, FileWarning, Inbox, ShieldAlert, Sparkles, Clapperboard } from "lucide-react";
import { ChartFrame, Sparkline } from "@/components/charts/Charts";
import { ReminderModal } from "@/components/studio/ReminderModal";
import { Card, StudioPage } from "@/components/studio/Shell";
import { WorkloadCard } from "@/components/studio/WorkloadCard";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { Avatar, BrandLogo } from "@/components/ui/Media";
import { PlatformBadge, PlatformGlyph } from "@/components/ui/PlatformIcon";
import { PLATFORMS } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { estimateRate } from "@/lib/logic/rate";
import { cn, compact, daysUntil, greeting, money, relDay } from "@/lib/utils";

type Action = {
  id: string;
  tone: "bad" | "warn" | "good" | "info";
  label: string;
  title: string;
  sub: string;
  logo?: { initials: string; color: string };
  avatar?: Parameters<typeof Avatar>[0]["k"];
  Icon: typeof Inbox;
  cta: string;
  onClick?: () => void;
  href?: string;
};

const TONE = {
  bad: "text-arches",
  warn: "text-amber",
  good: "text-babu",
  info: "text-sky",
};

export default function TodayPage() {
  return (
    <StudioPage>
      <Today />
    </StudioPage>
  );
}

function Today() {
  const profile = useApp((s) => s.profile);
  const deals = useApp((s) => s.deals);
  const content = useApp((s) => s.content);
  const threads = useApp((s) => s.threads);
  const bookings = useApp((s) => s.bookings);
  const packages = useApp((s) => s.packages);
  const earnings = useApp((s) => s.earnings);
  const openCopilot = useUi((s) => s.openCopilot);
  const onboarded = useApp((s) => s.onboarded);
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const [reminderFor, setReminderFor] = useState<Deal | null>(null);

  const actions: Action[] = useMemo(() => {
    const out: Action[] = [];
    for (const d of deals) {
      if (d.invoice && d.invoice.status !== "paid" && daysUntil(d.invoice.due) < 0)
        out.push({
          id: `inv-${d.id}`,
          tone: "bad",
          label: `Payment ${-daysUntil(d.invoice.due)} days overdue`,
          title: `${d.brand} owes you ${money(d.value)}`,
          sub: `${d.invoice.number} · ${d.invoice.remindersSent ? `${d.invoice.remindersSent} reminder sent` : "No reminder sent yet"}`,
          logo: { initials: d.brandInitials, color: d.brandColor },
          Icon: CircleDollarSign,
          cta: "Review AI reminder",
          onClick: () => setReminderFor(d),
        });
    }
    for (const d of deals.filter((x) => x.stage === "production" && daysUntil(x.dueDate) <= 4)) {
      const done = d.deliverables.filter((x) => x.done).length;
      out.push({
        id: `due-${d.id}`,
        tone: "warn",
        label: `Draft due ${relDay(d.dueDate).toLowerCase()}`,
        title: `${d.brand} — ${d.campaign}`,
        sub: `${done}/${d.deliverables.length} steps done · next: ${d.deliverables.find((x) => !x.done)?.label ?? "deliver"}`,
        logo: { initials: d.brandInitials, color: d.brandColor },
        Icon: CalendarClock,
        cta: "Open deal",
        href: `/studio/deals?open=${d.id}`,
      });
    }
    for (const d of deals.filter((x) => x.contractText && /perpetual/i.test(x.contractText) && x.stage === "negotiating")) {
      out.push({
        id: `con-${d.id}`,
        tone: "bad",
        label: "Risky contract",
        title: `Don't sign ${d.brand} yet`,
        sub: "Perpetual usage, Net-90 pay-when-paid, no kill fee",
        logo: { initials: d.brandInitials, color: d.brandColor },
        Icon: FileWarning,
        cta: "Review redlines",
        href: `/studio/deals?open=${d.id}&tab=contract`,
      });
    }
    for (const t of threads.filter((x) => x.unread && x.category === "deal" && x.dealSignal)) {
      out.push({
        id: `th-${t.id}`,
        tone: "good",
        label: "New brand inquiry",
        title: `${t.org} · ~${money(t.dealSignal!.estValue)}`,
        sub: t.summary,
        logo: { initials: t.initials ?? "?", color: t.color ?? "#222" },
        Icon: Inbox,
        cta: "Reply with AI",
        href: `/studio/inbox?t=${t.id}`,
      });
    }
    for (const t of threads.filter((x) => x.category === "spam" && x.unread)) {
      out.push({
        id: `sp-${t.id}`,
        tone: "info",
        label: "Scam blocked",
        title: `“${t.subject}”`,
        sub: "Asked for card details for a ‘free’ product. Moved out of your inbox.",
        Icon: ShieldAlert,
        cta: "See why",
        href: `/studio/inbox?t=${t.id}`,
      });
    }
    for (const b of bookings.filter((x) => x.status === "pending")) {
      const hoursLeft = Math.max(0, Math.round(24 - (Date.now() - new Date(b.createdAt).getTime()) / 3_600_000));
      out.unshift({
        id: `bk-${b.id}`,
        tone: "good",
        label: `Booking request · ${hoursLeft}h to respond`,
        title: `${b.brand} · ${money(b.price)}`,
        sub: `Wants “${packages.find((p) => p.id === b.packageId)?.title ?? "a package"}” · pays up front via CreatorCover`,
        logo: { initials: b.brandInitials, color: b.brandColor },
        Icon: CalendarCheck,
        cta: "Review request",
        href: "/studio/packages",
      });
    }
    for (const d of deals.filter((x) => x.review?.status === "changes")) {
      const notes = d.review!.comments.filter((c) => c.scope !== "praise");
      const outOfScope = notes.filter((c) => c.scope === "out").length;
      out.push({
        id: `rv-${d.id}`,
        tone: "warn",
        label: "Brand feedback on your draft",
        title: `${d.brand} left ${notes.length} notes`,
        sub: outOfScope ? `${outOfScope} asks for work outside your agreement — reply drafted` : "All within scope",
        logo: { initials: d.brandInitials, color: d.brandColor },
        Icon: MessageSquareText,
        cta: "Open review",
        href: `/studio/deals?open=${d.id}&tab=review`,
      });
    }
    return out;
  }, [deals, threads, bookings, packages]);

  const todayPosts = content.filter((c) => c.status !== "published" && daysUntil(c.date) === 0);
  const upcoming = content
    .filter((c) => c.status !== "published" && daysUntil(c.date) >= 0 && daysUntil(c.date) <= 14)
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  const owed = deals.filter((d) => d.invoice && d.invoice.status !== "paid").reduce((s, d) => s + d.value, 0);
  const pipeline = deals.filter((d) => !["paid", "invoiced"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const month = earnings[earnings.length - 1];
  const monthTotal = month.deals + month.ads + month.affiliate + month.members + month.products;
  const totals = earnings.map((m) => m.deals + m.ads + m.affiliate + m.members + m.products);
  const overdue = deals.find((d) => d.invoice && d.invoice.status !== "paid" && daysUntil(d.invoice.due) < 0);
  const lumen = deals.find((d) => d.stage === "production");
  const inquiry = threads.find((t) => t.unread && t.dealSignal);
  const inquiryRate = inquiry?.dealSignal
    ? estimateRate(profile, [{ platform: inquiry.dealSignal.platform, label: "60s integration", qty: 3 }], inquiry.dealSignal.category).target
    : 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">
          {greeting()}, {profile.firstName}
        </h1>
        <p className="mt-1 text-ink-2" suppressHydrationWarning>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · CreatorAI sorted {threads.length} messages and checked {deals.filter((d) => d.contractText).length} contracts since yesterday.
        </p>
      </div>

      {!onboarded && (
        <Link href="/onboarding" className="mb-6 flex items-center gap-4 rounded-2xl bg-surface p-4 transition hover:bg-surface-2 md:p-5">
          <span className="ai-bg flex size-10 shrink-0 items-center justify-center rounded-full">
            <AiSpark className="size-5 [&_path]:fill-white" />
          </span>
          <span className="flex-1 text-sm">
            <b className="block text-[15px]">Personalize CreatorAI in about a minute</b>
            <span className="text-ink-2">Connect platforms, set your niche and goals, and tell us how much time you really have each week.</span>
          </span>
          <ChevronRight className="size-5 shrink-0" />
        </Link>
      )}

      {/* AI brief */}
      <div className="ai-border mb-10 rounded-3xl p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AiSpark className="size-5" /> Your daily brief
          </h2>
          <button onClick={() => openCopilot("What should I focus on this week?")} className="text-sm font-semibold underline underline-offset-2">
            Ask a follow-up
          </button>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {overdue && (
            <BriefItem n={1} title={`Chase ${overdue.brand}’s ${money(overdue.value)}`} text={`It's ${-daysUntil(overdue.invoice!.due)} days late. I drafted a friendly reminder that mentions nothing awkward.`} cta="Review reminder" onClick={() => setReminderFor(overdue)} />
          )}
          {lumen && (
            <BriefItem
              n={2}
              title={`Send the ${lumen.brand} draft`}
              text={`Due ${relDay(lumen.dueDate).toLowerCase()}. Filming is done — once it's sent, ${money(lumen.value)} is unlocked on a Net-${lumen.paymentTerms}.`}
              cta="Open checklist"
              href={`/studio/deals?open=${lumen.id}`}
            />
          )}
          {inquiry && (
            <BriefItem
              n={3}
              title={`Reply to ${inquiry.org}`}
              text={`${inquiry.summary} Your fair rate for 3 integrations is ~${money(inquiryRate)} — I'd anchor there.`}
              cta="Draft reply"
              href={`/studio/inbox?t=${inquiry.id}`}
            />
          )}
        </ol>
      </div>

      <div className="mb-6 flex justify-center">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "today", label: "Today" },
            { id: "upcoming", label: "Upcoming" },
          ]}
        />
      </div>

      {tab === "today" ? (
        <section className="mb-12">
          <h2 className="mb-4 text-[22px] font-semibold">Needs your attention · {actions.length}</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {actions.map((a) => (
              <ActionCard key={a.id} a={a} />
            ))}
          </div>
          {todayPosts.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-lg font-semibold">Publishing today</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {todayPosts.map((p) => (
                  <Link key={p.id} href="/studio/calendar" className="flex items-center gap-4 rounded-xl border border-line-soft p-4 hover:shadow-soft">
                    <PlatformBadge platform={p.platform} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.title}</div>
                      <div className="text-sm text-ink-2">
                        {PLATFORMS[p.platform].label} · {p.format} · {p.time ?? "Anytime"} · {p.status}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-ink-2" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="mb-12">
          <h2 className="mb-4 text-[22px] font-semibold">Next 14 days</h2>
          <div className="divide-y divide-line-soft rounded-2xl border border-line-soft">
            {upcoming.map((c) => (
              <Link key={c.id} href="/studio/calendar" className="flex items-center gap-4 px-5 py-4 hover:bg-surface">
                <div className="w-20 shrink-0 text-sm">
                  <div className="font-semibold">{relDay(c.date)}</div>
                  <div className="text-ink-2">{c.time ?? "—"}</div>
                </div>
                <PlatformGlyph platform={c.platform} size={18} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.title}</div>
                  <div className="text-sm text-ink-2">
                    {c.format} · ~{c.effort}h {c.dealId && "· Sponsored"}
                  </div>
                </div>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold capitalize">{c.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <WorkloadCard />
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Money</h3>
                <p className="text-sm text-ink-2">Earned this month so far</p>
              </div>
              <Link href="/studio/earnings" className="text-sm font-semibold underline underline-offset-2">
                Earnings
              </Link>
            </div>
            <div className="mt-3 text-[32px] font-semibold">{money(monthTotal)}</div>
            <ChartFrame className="mt-2">
              <Sparkline
                values={totals}
                labels={earnings.map((m) => new Date(m.month + "-01T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" }))}
                format={(n) => money(n)}
                height={48}
              />
            </ChartFrame>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface p-3">
                <div className="text-ink-2">Owed to you</div>
                <div className="text-lg font-semibold">{money(owed)}</div>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <div className="text-ink-2">In the pipeline</div>
                <div className="text-lg font-semibold">{money(pipeline)}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Audience</h3>
              <Link href="/studio/insights" className="text-sm font-semibold underline underline-offset-2">
                Insights
              </Link>
            </div>
            <ul className="space-y-3">
              {profile.platforms.slice(0, 4).map((p) => (
                <li key={p.platform} className="flex items-center gap-3 text-sm">
                  <PlatformGlyph platform={p.platform} size={16} />
                  <span className="flex-1">{PLATFORMS[p.platform].label}</span>
                  <span className="font-semibold">{compact(p.followers)}</span>
                  <span className={cn("w-14 text-right text-xs font-semibold", p.growth30d > 0.03 ? "text-babu" : "text-ink-2")}>+{(p.growth30d * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Shortcut href="/studio/create" Icon={Sparkles} title="Make something" text="Ideas, scripts and repurposing in your voice" />
        <Shortcut href="/" Icon={Clapperboard} title="Find brand deals" text="Matched to your audience, with real payout history" />
        <Shortcut href="/c/mayamakes" Icon={ArrowRight} title="Share your media kit" text="Always up to date with live stats" />
      </div>

      <ReminderModal deal={reminderFor} onClose={() => setReminderFor(null)} />
    </>
  );
}

function BriefItem({ n, title, text, cta, onClick, href }: { n: number; title: string; text: string; cta: string; onClick?: () => void; href?: string }) {
  return (
    <li className="flex flex-col rounded-2xl bg-surface p-5">
      <span className="mb-3 flex size-7 items-center justify-center rounded-full bg-white text-sm font-bold shadow-soft">{n}</span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-2">{text}</p>
      <div className="mt-4">
        {href ? (
          <Button href={href} size="sm" variant="outline">
            {cta}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onClick}>
            {cta}
          </Button>
        )}
      </div>
    </li>
  );
}

function ActionCard({ a }: { a: Action }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", TONE[a.tone])}>
            <a.Icon className="size-4" /> {a.label}
          </div>
          <div className="mt-2 line-clamp-1 text-[17px] font-semibold">{a.title}</div>
          <div className="mt-1 line-clamp-2 text-sm text-ink-2">{a.sub}</div>
        </div>
        {a.logo && <BrandLogo initials={a.logo.initials} color={a.logo.color} size={40} />}
      </div>
      <div className="mt-auto border-t border-line-soft px-5 py-3.5 text-sm font-semibold">{a.cta}</div>
    </>
  );
  const cls = "flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-line text-left transition hover:shadow-card";
  return a.href ? (
    <Link href={a.href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={a.onClick} className={cls}>
      {inner}
    </button>
  );
}

function Shortcut({ href, Icon, title, text }: { href: string; Icon: typeof Inbox; title: string; text: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-line-soft p-5 transition hover:shadow-soft">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-2">
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-2">{text}</span>
      </span>
      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
