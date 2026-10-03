"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash, Wand2 } from "lucide-react";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Controls";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { PLATFORMS } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { ContentItem, ContentStatus, Platform } from "@/lib/types";
import { cn, daysUntil, fmtDate, fromISODate, toISODate, today } from "@/lib/utils";

const STATUS_STYLE: Record<ContentStatus, string> = {
  idea: "bg-white border border-dashed border-[#b0b0b0] text-ink-2",
  scripting: "bg-surface-2 text-ink",
  filming: "bg-surface-2 text-ink",
  editing: "bg-surface-2 text-ink",
  scheduled: "bg-ink text-white",
  published: "bg-babu-soft text-babu",
};
const STATUSES: ContentStatus[] = ["idea", "scripting", "filming", "editing", "scheduled", "published"];

export default function CalendarPage() {
  return (
    <StudioPage wide>
      <Calendar />
    </StudioPage>
  );
}

function Calendar() {
  const content = useApp((s) => s.content);
  const deals = useApp((s) => s.deals);
  const capacity = useApp((s) => s.profile.weeklyCapacityHours);
  const profile = useApp((s) => s.profile);
  const updateContent = useApp((s) => s.updateContent);
  const addContent = useApp((s) => s.addContent);
  const toast = useUi((s) => s.toast);
  const t0 = today();
  const [cursor, setCursor] = useState(new Date(t0.getFullYear(), t0.getMonth(), 1));
  const [selected, setSelected] = useState(toISODate(t0));
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const perDayCap = capacity / 6;

  const days = useMemo(() => {
    const first = new Date(cursor);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // weeks start Monday
    return [...Array(42).keys()].map((i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const visible = content.filter((c) => filter === "all" || c.platform === filter);
  const byDay = (iso: string) => visible.filter((c) => c.date === iso).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const load = (iso: string) => content.filter((c) => c.date === iso && c.status !== "published").reduce((s, c) => s + c.effort, 0);
  const deadlines = (iso: string) => deals.filter((d) => d.dueDate === iso && !["paid", "invoiced"].includes(d.stage));

  const fillGaps = async () => {
    setFilling(true);
    try {
      const res = await runAi("ideas", { creator: creatorBrief(profile), prompt: "", platform: "any", recent: content.slice(-10).map((c) => c.title) });
      const free = [...Array(14).keys()]
        .map((i) => {
          const d = today();
          d.setDate(d.getDate() + i + 1);
          return toISODate(d);
        })
        .filter((iso) => load(iso) === 0);
      // Keep one free day per week fully empty as a rest day.
      const restDays = new Set([free[free.length - 1], free[Math.floor(free.length / 2)]].filter(Boolean));
      const slots = free.filter((d) => !restDays.has(d)).slice(0, 3);
      slots.forEach((iso, i) => {
        const idea = res.data.ideas[i];
        if (idea) addContent({ title: idea.title, platform: idea.platform, format: idea.format, status: "idea", date: iso, effort: idea.effort, aiGenerated: true, notes: idea.hook });
      });
      toast(slots.length ? `Added ${slots.length} ideas to open days — and kept ${restDays.size} rest day${restDays.size > 1 ? "s" : ""} free.` : "Your next two weeks are already full. Nice.");
    } finally {
      setFilling(false);
    }
  };

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <PageTitle
        title="Calendar"
        sub="Drag posts between days. Shaded days are close to your daily capacity."
        right={
          <Button variant="ai" onClick={fillGaps} loading={filling}>
            {!filling && <Wand2 className="size-4" />} Fill my next 2 weeks
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="flex size-9 items-center justify-center rounded-full hover:bg-surface-2">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="min-w-44 text-center text-lg font-semibold">{monthLabel}</h2>
          <button aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="flex size-9 items-center justify-center rounded-full hover:bg-surface-2">
            <ChevronRight className="size-5" />
          </button>
          <Button
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => {
              setCursor(new Date(t0.getFullYear(), t0.getMonth(), 1));
              setSelected(toISODate(t0));
            }}
          >
            Today
          </Button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            All platforms
          </Chip>
          {(["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter"] as Platform[]).map((p) => (
            <Chip key={p} active={filter === p} onClick={() => setFilter(p)}>
              <PlatformGlyph platform={p} size={13} /> {PLATFORMS[p].label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-line-soft pb-2 text-xs font-semibold text-ink-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const iso = toISODate(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = iso === toISODate(t0);
                const past = daysUntil(iso) < 0;
                const items = byDay(iso);
                const l = load(iso);
                const ratio = l / perDayCap;
                const dl = deadlines(iso);
                return (
                  <div
                    key={iso}
                    onClick={() => setSelected(iso)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverDay(iso);
                    }}
                    onDrop={() => {
                      if (dragId) {
                        updateContent(dragId, { date: iso });
                        toast(`Moved to ${fmtDate(iso, { weekday: "long", month: "short", day: "numeric" })}`);
                      }
                      setDragId(null);
                      setOverDay(null);
                    }}
                    className={cn(
                      "relative flex min-h-[124px] cursor-pointer flex-col gap-1 border-r border-b border-line-soft p-2 transition-colors [&:nth-child(7n)]:border-r-0",
                      !inMonth && "bg-surface/60",
                      selected === iso && "ring-2 ring-ink ring-inset",
                      overDay === iso && "bg-rausch-soft",
                    )}
                    style={inMonth && !past && ratio > 0.75 ? { background: ratio > 1.1 ? "#fff1ed" : "#fff8eb" } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("flex size-7 items-center justify-center rounded-full text-sm", isToday ? "bg-ink font-semibold text-white" : inMonth ? (past ? "text-ink-3" : "font-semibold") : "text-ink-3")}>{d.getDate()}</span>
                      {l > 0 && !past && <span className="text-[10px] text-ink-2">{l}h</span>}
                    </div>
                    {dl.map((x) => (
                      <span key={x.id} className="truncate rounded-md border border-rausch px-1.5 py-0.5 text-[11px] font-semibold text-rausch-dark">
                        ⏰ {x.brand} due
                      </span>
                    ))}
                    {items.slice(0, 3).map((c) => (
                      <PostChip key={c.id} c={c} onDragStart={() => setDragId(c.id)} />
                    ))}
                    {items.length > 3 && <span className="px-1 text-[11px] font-semibold text-ink-2">+{items.length - 3} more</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DayPanel iso={selected} items={byDay(selected)} load={load(selected)} perDayCap={perDayCap} deadlines={deadlines(selected)} />
      </div>
    </>
  );
}

function PostChip({ c, onDragStart }: { c: ContentItem; onDragStart: () => void }) {
  return (
    <span
      draggable={c.status !== "published"}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart();
      }}
      className={cn("flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] font-medium", STATUS_STYLE[c.status], c.status !== "published" && "cursor-grab")}
      title={`${c.title} · ${c.status}`}
    >
      <PlatformGlyph platform={c.platform} size={11} className="shrink-0" />
      <span className="truncate">{c.title}</span>
    </span>
  );
}

function DayPanel({ iso, items, load, perDayCap, deadlines }: { iso: string; items: ContentItem[]; load: number; perDayCap: number; deadlines: { id: string; brand: string; campaign: string }[] }) {
  const updateContent = useApp((s) => s.updateContent);
  const removeContent = useApp((s) => s.removeContent);
  const addContent = useApp((s) => s.addContent);
  const toast = useUi((s) => s.toast);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const ratio = load / perDayCap;
  return (
    <aside className="h-fit rounded-2xl border border-line-soft p-6 xl:sticky xl:top-28">
      <div className="text-sm text-ink-2">{fromISODate(iso).toLocaleDateString("en-US", { weekday: "long" })}</div>
      <h3 className="text-2xl font-semibold">{fmtDate(iso, { month: "long", day: "numeric" })}</h3>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, background: ratio > 1.1 ? "#c13515" : ratio > 0.75 ? "#e07a00" : "#008a05" }} />
        </div>
        <span className="text-ink-2">
          {load}h / {perDayCap.toFixed(1)}h
        </span>
      </div>
      {ratio > 1.1 && (
        <p className="mt-3 flex gap-2 rounded-xl bg-arches-soft p-3 text-sm text-arches">
          <AiSpark className="mt-0.5 size-4 shrink-0" /> This day is over capacity. Drag a non-deal post to a lighter day.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {deadlines.map((d) => (
          <div key={d.id} className="rounded-xl border border-rausch/40 bg-rausch-soft p-3 text-sm">
            <b>{d.brand}</b> deliverable due · {d.campaign}
          </div>
        ))}
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-line-soft p-4">
            <div className="flex items-start gap-3">
              <PlatformGlyph platform={c.platform} size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="text-xs text-ink-2">
                  {c.format} · {c.time ?? "No time"} · ~{c.effort}h {c.dealId && "· Sponsored"} {c.aiGenerated && "· AI idea"}
                </div>
                {c.notes && <div className="mt-1 text-xs text-ink-2 italic">“{c.notes}”</div>}
              </div>
              <button
                aria-label="Delete"
                onClick={() => {
                  removeContent(c.id);
                  toast("Removed from calendar");
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
              >
                <Trash className="size-3.5" />
              </button>
            </div>
            <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateContent(c.id, { status: s })}
                  className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", c.status === s ? "bg-ink text-white" : "bg-surface-2 text-ink-2 hover:text-ink")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!items.length && !deadlines.length && <p className="rounded-xl bg-surface p-4 text-sm text-ink-2">Nothing planned. Rest days count as productive days. 🌿</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addContent({ title: title.trim(), platform, format: platform === "youtube" ? "Long video" : platform === "newsletter" ? "Newsletter" : "Short", status: "idea", date: iso, effort: platform === "youtube" ? 6 : 1.5 });
          setTitle("");
          toast("Added to calendar");
        }}
        className="mt-6 border-t border-line-soft pt-5"
      >
        <div className="mb-2 text-sm font-semibold">Add a post</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Working title" className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none focus:border-ink" />
        <div className="mt-2 flex gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="flex-1 rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none">
            {(["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter"] as Platform[]).map((p) => (
              <option key={p} value={p}>
                {PLATFORMS[p].label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="dark" size="md">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </form>
    </aside>
  );
}
