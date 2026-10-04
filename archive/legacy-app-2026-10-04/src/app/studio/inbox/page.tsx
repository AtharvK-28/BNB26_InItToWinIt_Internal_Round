"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Bookmark, ChevronLeft, Flag, Lightbulb, ShieldAlert, Users, Wand2 } from "lucide-react";
import { StudioPage } from "@/components/studio/Shell";
import { ReminderModal } from "@/components/studio/ReminderModal";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Controls";
import { Avatar } from "@/components/ui/Media";
import { PlatformBadge } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import type { RepliesOut } from "@/lib/ai/schemas";
import { INBOX_CATEGORIES, PLATFORMS } from "@/lib/data/meta";
import { estimateRate } from "@/lib/logic/rate";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Deal, InboxCategory, Thread } from "@/lib/types";
import { cn, money, timeAgo } from "@/lib/utils";

type Filter = "all" | InboxCategory;

export default function InboxPage() {
  return (
    <StudioPage wide className="py-0! md:py-0!">
      <Suspense>
        <Inbox />
      </Suspense>
    </StudioPage>
  );
}

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const threads = useApp((s) => s.threads);
  const markRead = useApp((s) => s.markThreadRead);
  const [filter, setFilter] = useState<Filter>("all");
  const activeId = params.get("t");
  const active = threads.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    if (active?.unread) markRead(active.id);
  }, [active, markRead]);

  const order = { high: 0, medium: 1, low: 2 };
  const list = useMemo(
    () =>
      threads
        .filter((t) => (filter === "all" ? t.category !== "spam" : t.category === filter))
        .sort((a, b) => order[a.priority] - order[b.priority] || +new Date(b.messages.at(-1)!.at) - +new Date(a.messages.at(-1)!.at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads, filter],
  );
  const count = (c: InboxCategory) => threads.filter((t) => t.category === c).length;
  const select = (id: string | null) => router.push(id ? `/studio/inbox?t=${id}` : "/studio/inbox", { scroll: false });

  return (
    <div className="-mx-4 grid h-[calc(100dvh-80px-64px)] grid-cols-1 md:-mx-6 md:h-[calc(100dvh-80px)] md:grid-cols-[360px_1fr] lg:-mx-10 xl:-mx-20 xl:grid-cols-[380px_1fr_340px]">
      {/* Thread list */}
      <aside className={cn("flex min-h-0 flex-col border-r border-line-soft", active && "hidden md:flex")}>
        <div className="px-6 pt-6 pb-3">
          <h1 className="text-[26px] font-semibold">Messages</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
            <AiSpark className="size-3.5" /> Email, DMs and comments in one place — sorted by AI
          </p>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 pb-4">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Chip>
          {(Object.keys(INBOX_CATEGORIES) as InboxCategory[]).map((c) => (
            <Chip key={c} active={filter === c} onClick={() => setFilter(c)} count={count(c)}>
              {INBOX_CATEGORIES[c].label}
            </Chip>
          ))}
        </div>
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          {list.map((t) => (
            <ThreadRow key={t.id} t={t} active={t.id === activeId} onClick={() => select(t.id)} />
          ))}
          {filter === "all" && count("spam") > 0 && (
            <button onClick={() => setFilter("spam")} className="mx-3 mt-3 flex w-[calc(100%-24px)] items-center gap-2 rounded-xl bg-surface px-4 py-3 text-left text-xs text-ink-2">
              <ShieldAlert className="size-4" /> {count("spam")} likely scam{count("spam") > 1 ? "s" : ""} filtered out of your inbox
            </button>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className={cn("flex min-h-0 flex-col", !active && "hidden md:flex")}>
        {active ? (
          <Conversation key={active.id} t={active} onBack={() => select(null)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2">
              <AiSpark className="size-6" />
            </span>
            <h2 className="text-xl font-semibold">Pick a conversation</h2>
            <p className="mt-1 max-w-sm text-ink-2">CreatorAI has already sorted your messages, summarized long threads and flagged anything that looks like a scam.</p>
          </div>
        )}
      </section>

      {/* Details */}
      <aside className="hidden min-h-0 overflow-y-auto border-l border-line-soft xl:block">{active && <Details key={active.id} t={active} />}</aside>
    </div>
  );
}

function ThreadAvatar({ t, size = 48 }: { t: Thread; size?: number }) {
  return (
    <span className="relative shrink-0">
      <Avatar k={t.avatar} initials={t.initials} color={t.color} size={size} />
      <PlatformBadge platform={t.channel} size={20} className="absolute -right-1 -bottom-1" />
    </span>
  );
}

function ThreadRow({ t, active, onClick }: { t: Thread; active: boolean; onClick: () => void }) {
  const last = t.messages[t.messages.length - 1];
  const cat = INBOX_CATEGORIES[t.category];
  return (
    <button onClick={onClick} className={cn("flex w-full gap-3 rounded-xl px-3 py-3.5 text-left transition", active ? "bg-surface-2" : "hover:bg-surface")}>
      <ThreadAvatar t={t} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[15px]", t.unread ? "font-bold" : "font-semibold")}>{t.org ?? t.name}</span>
          <span className="shrink-0 text-xs text-ink-2" suppressHydrationWarning>
            {timeAgo(last.at)}
          </span>
        </div>
        <div className={cn("truncate text-sm", t.unread ? "text-ink" : "text-ink-2")}>
          {last.from === "me" && "You: "}
          {last.text}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: cat.color, background: cat.bg }}>
            {cat.label}
          </span>
          {t.priority === "high" && <span className="text-[11px] font-semibold text-ink">High priority</span>}
          {t.unread && <span className="ml-auto size-2 rounded-full bg-rausch" />}
        </div>
      </div>
    </button>
  );
}

function Conversation({ t, onBack }: { t: Thread; onBack: () => void }) {
  const profile = useApp((s) => s.profile);
  const sendMessage = useApp((s) => s.sendMessage);
  const toast = useUi((s) => s.toast);
  const [text, setText] = useState("");
  const [replies, setReplies] = useState<RepliesOut["replies"] | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(t.category !== "spam");
  const bottom = useRef<HTMLDivElement>(null);
  const rateHint = estimateRate(profile, [{ platform: "youtube", label: "60s integration", qty: 1 }], "tech").target;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [t.messages.length]);

  const requestReplies = () =>
    runAi("reply", {
      creator: creatorBrief(profile),
      name: t.name,
      org: t.org,
      category: t.category,
      messages: t.messages.map((m) => ({ from: m.from, text: m.text })),
      rateHint: t.category === "deal" ? rateHint : undefined,
    });
  const load = (alive: () => boolean = () => true) =>
    requestReplies()
      .then((res) => {
        if (!alive()) return;
        setReplies(res.data.replies);
        setSource(res.source);
      })
      .catch(() => alive() && toast("Couldn't draft replies — try again."))
      .finally(() => alive() && setLoading(false));
  const suggest = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    if (t.category === "spam") return;
    let alive = true;
    load(() => alive);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = () => {
    if (!text.trim()) return;
    sendMessage(t.id, text.trim());
    setText("");
    setReplies(null);
    toast(`Sent via ${t.channel === "email" ? "email" : PLATFORMS[t.channel].label}`);
  };

  return (
    <>
      <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line-soft px-4 md:px-6">
        <button onClick={onBack} className="flex size-8 items-center justify-center rounded-full hover:bg-surface-2 md:hidden" aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <ThreadAvatar t={t} size={40} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{t.org ? `${t.name} · ${t.org}` : t.name}</div>
          <div className="truncate text-xs text-ink-2">
            {t.channel === "email" ? "Email" : PLATFORMS[t.channel].label} · {t.subject}
          </div>
        </div>
      </header>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {t.scamSignal ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-arches/25 bg-arches-soft p-4 text-sm">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-arches" />
            <div>
              <div className="font-semibold text-arches">Likely scam — don&apos;t reply or pay</div>
              <p className="mt-1 text-ink">{t.scamSignal}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex gap-3 rounded-2xl bg-surface p-4 text-sm">
            <AiSpark className="mt-0.5 size-4 shrink-0" />
            <div>
              <span className="font-semibold">Summary: </span>
              {t.summary}
            </div>
          </div>
        )}
        <div className="space-y-6">
          {t.messages.map((m) =>
            m.from === "them" ? (
              <div key={m.id} className="flex max-w-[85%] gap-3">
                <Avatar k={t.avatar} initials={t.initials} color={t.color} size={36} />
                <div>
                  <div className="mb-1 text-xs text-ink-2">
                    <b className="text-ink">{t.name}</b> · <span suppressHydrationWarning>{timeAgo(m.at)}</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ) : (
              <div key={m.id} className="ml-auto flex max-w-[85%] flex-col items-end">
                <div className="mb-1 text-xs text-ink-2" suppressHydrationWarning>
                  You · {timeAgo(m.at)}
                </div>
                <div className="rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-white">{m.text}</div>
              </div>
            ),
          )}
        </div>
        <div ref={bottom} />
      </div>

      <div className="shrink-0 border-t border-line-soft px-4 pt-3 pb-4 md:px-6">
        {t.category !== "spam" && (
          <div className="mb-3">
            {loading ? (
              <AiThinking label="Drafting replies in your voice" />
            ) : replies ? (
              <div className="flex items-center gap-2">
                <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
                  {replies.map((r) => (
                    <button key={r.label} onClick={() => setText(r.text)} className="ai-border shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:shadow-soft">
                      {r.label}
                    </button>
                  ))}
                </div>
                <SourceBadge source={source} className="hidden shrink-0 sm:inline-flex" />
              </div>
            ) : (
              <button onClick={suggest} className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Wand2 className="size-4" /> Suggest replies
              </button>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-line px-2 py-2 focus-within:border-ink">
          <SavedRepliesButton onPick={(t) => setText(t)} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={text ? Math.min(8, text.split("\n").length + 1) : 1}
            placeholder={t.category === "spam" ? "Replying isn't recommended" : "Write a message…"}
            className="thin-scrollbar flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none"
          />
          <button onClick={send} disabled={!text.trim()} className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:bg-line" aria-label="Send">
            <ArrowUp className="size-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
}

function Details({ t }: { t: Thread }) {
  const router = useRouter();
  const profile = useApp((s) => s.profile);
  const deals = useApp((s) => s.deals);
  const convert = useApp((s) => s.convertThread);
  const addContent = useApp((s) => s.addContent);
  const openCopilot = useUi((s) => s.openCopilot);
  const toast = useUi((s) => s.toast);
  const [remind, setRemind] = useState<Deal | null>(null);
  const linked = deals.find((d) => d.brand === (t.dealSignal?.brand ?? t.org) && d.stage !== "paid");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-center border-b border-line-soft pb-6 text-center">
        <Avatar k={t.avatar} initials={t.initials} color={t.color} size={72} />
        <div className="mt-3 text-lg font-semibold">{t.name}</div>
        {t.org && <div className="text-sm text-ink-2">{t.org}</div>}
      </div>

      {t.dealSignal && !linked && (
        <div className="ai-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AiSpark className="size-4" /> Deal detected
          </div>
          <div className="mt-3 text-2xl font-semibold">~{money(t.dealSignal.estValue)}</div>
          <div className="text-sm text-ink-2">{t.dealSignal.campaign}</div>
          <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
            Your fair rate for this scope:{" "}
            <b>{money(estimateRate(profile, [{ platform: t.dealSignal.platform, label: "60s integration", qty: 3 }], t.dealSignal.category).target)}</b>
          </div>
          <Button
            variant="dark"
            className="mt-4 w-full"
            onClick={() => {
              const id = convert(t.id);
              toast(`${t.dealSignal!.brand} added to your pipeline.`, { label: "Open", href: `/studio/deals?open=${id}` });
            }}
          >
            Add to pipeline
          </Button>
        </div>
      )}

      {linked && (
        <div className="rounded-2xl border border-line-soft p-5">
          <div className="text-xs font-semibold text-ink-2">Linked deal</div>
          <div className="mt-1 font-semibold">{linked.campaign}</div>
          <div className="text-sm text-ink-2">
            {money(linked.value)} · {linked.stage}
          </div>
          {linked.contractText && /perpetual/i.test(linked.contractText) && (
            <p className="mt-3 flex gap-2 rounded-xl bg-arches-soft p-3 text-sm text-arches">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" /> The attached contract has 6 high-risk clauses.
            </p>
          )}
          {linked.invoice && linked.invoice.status !== "paid" && (
            <Button variant="rausch" className="mt-4 w-full" onClick={() => setRemind(linked)}>
              Send payment reminder
            </Button>
          )}
          <Button variant="outline" className="mt-2 w-full" onClick={() => router.push(`/studio/deals?open=${linked.id}${linked.contractText ? "&tab=contract" : ""}`)}>
            {linked.contractText ? "Review contract" : "Open deal"}
          </Button>
        </div>
      )}

      {t.category === "collab" && (
        <div className="rounded-2xl border border-line-soft p-5 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="size-4" /> Collab fit
          </div>
          <p className="mt-2 text-ink-2">Similar audience, low competition: a collab could reach thousands of new viewers who already like your kind of content.</p>
          <Button
            variant="dark"
            className="mt-4 w-full"
            onClick={() => {
              addContent({ title: `Collab with ${t.name}: ${t.subject}`, platform: "youtube", format: "Long video", status: "idea", date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10), effort: 6 });
              toast("Collab added to your calendar as an idea.", { label: "Calendar", href: "/studio/calendar" });
            }}
          >
            Add collab to calendar
          </Button>
          <Link href="/collabs" className="mt-2 block text-center font-semibold underline underline-offset-2">
            Find more collaborators
          </Link>
        </div>
      )}

      {t.category === "fan" && (
        <div className="rounded-2xl border border-line-soft p-5 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Lightbulb className="size-4" /> Content opportunity
          </div>
          <p className="mt-2 text-ink-2">Questions like this come up often in your comments. Answering once, publicly, saves you dozens of replies.</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => openCopilot(`Give me 3 video ideas that answer this fan question: "${t.messages[0].text}"`)}>
            Turn into content ideas
          </Button>
        </div>
      )}

      {t.category === "spam" && (
        <div className="rounded-2xl border border-line-soft p-5 text-sm">
          <div className="font-semibold">Why we flagged this</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
            <li>Asks you to pay to receive a “free” product</li>
            <li>Requests card details over DM</li>
            <li>Artificial urgency (“before midnight”)</li>
          </ul>
          <Button variant="outline" className="mt-4 w-full" onClick={() => toast("Reported and blocked. Thanks for keeping the community safe.")}>
            <Flag className="size-4" /> Report & block
          </Button>
        </div>
      )}
      <ReminderModal deal={remind} onClose={() => setRemind(null)} />
    </div>
  );
}

function SavedRepliesButton({ onPick }: { onPick: (text: string) => void }) {
  const replies = useApp((s) => s.quickReplies);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mb-0.5">
      <button onClick={() => setOpen((o) => !o)} aria-label="Saved replies" title="Saved replies" className="flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
        <Bookmark className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-11 left-0 z-50 w-80 animate-pop overflow-hidden rounded-2xl bg-white py-2 shadow-panel">
            <div className="px-4 pt-1 pb-2 text-xs font-semibold text-ink-2">Saved replies</div>
            {replies.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onPick(r.text);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left hover:bg-surface"
              >
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="truncate text-xs text-ink-2">{r.text}</div>
              </button>
            ))}
            <Link href="/studio/automations" className="mt-1 block border-t border-line-soft px-4 pt-2.5 pb-1 text-xs font-semibold underline underline-offset-2">
              Manage saved replies & automations
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
