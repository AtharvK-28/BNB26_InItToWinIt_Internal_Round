"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Search, X, Zap, Sparkles as SparklesIcon, CalendarPlus } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { AiSpark } from "@/components/ui/Ai";
import { CAMPAIGNS } from "@/lib/data/campaigns";
import { CATEGORIES, categoryLabel, PLATFORMS } from "@/lib/data/meta";
import { toQuery, type DealFilters } from "@/lib/filters";
import type { Category, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

type Seg = "niche" | "platform" | "budget" | "pay";

const BUDGETS = [
  { v: undefined, label: "Any budget" },
  { v: 2000, label: "$2,000+" },
  { v: 3500, label: "$3,500+" },
  { v: 5000, label: "$5,000+" },
];
const PAYS = [
  { v: undefined, label: "Any time" },
  { v: 7, label: "7 days" },
  { v: 15, label: "15 days" },
  { v: 30, label: "30 days" },
];

function nicheLabel(f: DealFilters) {
  if (f.q) return f.q;
  if (f.cat === "matched") return "Matched for you";
  if (f.cat === "fast") return "Pays fast";
  if (f.cat === "new") return "New this week";
  if (f.cat) return categoryLabel(f.cat as Category);
  return "";
}

export function SearchBar({ initial, compact, onExpand, segments = ["niche", "platform", "budget", "pay"] }: { initial: DealFilters; compact?: boolean; onExpand?: () => void; segments?: Seg[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState<DealFilters>(initial);
  const [active, setActive] = useState<Seg | null>(null);
  const [text, setText] = useState(nicheLabel(initial));
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (next: DealFilters = f) => {
    setActive(null);
    router.push(`${pathname}${toQuery({ ...next, sort: initial.sort })}`);
  };

  const suggestions = useMemo(() => {
    const t = text.trim().toLowerCase();
    if (!t || t === nicheLabel(f).toLowerCase()) return null;
    const cats = CATEGORIES.filter((c) => c.label.toLowerCase().includes(t)).slice(0, 3);
    const brands = CAMPAIGNS.filter((c) => c.brand.toLowerCase().includes(t) || c.title.toLowerCase().includes(t)).slice(0, 4);
    return { cats, brands };
  }, [text, f]);

  if (compact)
    return (
      <button
        onClick={onExpand}
        className="flex h-12 items-center rounded-full border border-line bg-white pr-2 pl-6 text-sm font-semibold shadow-search transition hover:shadow-card"
      >
        <span className="max-w-36 truncate">{nicheLabel(initial) || "Any niche"}</span>
        <span className="mx-4 h-6 w-px bg-line" />
        <span className={cn("max-w-28 truncate", !initial.platform && "font-semibold")}>{initial.platform ? PLATFORMS[initial.platform].label : "Any platform"}</span>
        {segments.includes("budget") && (
          <>
            <span className="mx-4 h-6 w-px bg-line" />
            <span className={cn(initial.budget ? "text-ink" : "font-normal text-ink-2")}>{initial.budget ? `$${initial.budget.toLocaleString()}+` : "Any budget"}</span>
          </>
        )}
        <span className="ml-4 flex size-8 items-center justify-center rounded-full bg-rausch text-white">
          <Search className="size-3.5" strokeWidth={3} />
        </span>
      </button>
    );

  const segCls = (s: Seg) =>
    cn(
      "relative flex h-full flex-col justify-center rounded-full px-8 text-left transition-colors",
      active === s ? "bg-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]" : active ? "hover:bg-[#dddddd]" : "hover:bg-surface-2",
    );
  const label = "text-xs font-semibold text-ink";
  const value = (empty: boolean) => cn("truncate text-sm", empty ? "text-ink-2" : "font-semibold text-ink");

  const segTitles: Record<Seg, string> = { niche: "Niche", platform: "Platform", budget: "Budget", pay: "Pays within" };

  return (
    <div className="relative mx-auto w-full max-w-[860px]">
      <div
        className={cn(
          "flex h-[66px] items-center rounded-full border border-line shadow-search transition-colors",
          active ? "bg-surface-2" : "bg-white",
        )}
      >
        {segments.map((s, i) => {
          const isLast = i === segments.length - 1;
          return (
            <div key={s} className={cn("relative flex h-full items-center", s === "niche" ? "flex-[1.4]" : "flex-1", "min-w-0")}>
              {i > 0 && <span className={cn("absolute left-0 h-8 w-px bg-line transition-opacity", (active === s || active === segments[i - 1]) && "opacity-0")} />}
              <div
                role="button"
                tabIndex={0}
                className={cn(segCls(s), "w-full", isLast && (active ? "pr-[124px]" : "pr-[72px]"))}
                onClick={() => {
                  setActive(s);
                  if (s === "niche") setTimeout(() => inputRef.current?.focus(), 0);
                }}
                onKeyDown={(e) => e.key === "Enter" && setActive(s)}
              >
                <span className={label}>{segTitles[s]}</span>
                {s === "niche" ? (
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setF((x) => ({ ...x, q: e.target.value || undefined, cat: undefined }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") go({ ...f, q: text || undefined, cat: f.cat });
                    }}
                    placeholder="Search brands or topics"
                    className="w-full truncate bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-2"
                  />
                ) : s === "platform" ? (
                  <span className={value(!f.platform)}>{f.platform ? PLATFORMS[f.platform].label : "Any platform"}</span>
                ) : s === "budget" ? (
                  <span className={value(!f.budget)}>{BUDGETS.find((b) => b.v === f.budget)?.label}</span>
                ) : (
                  <span className={value(!f.pay)}>{PAYS.find((b) => b.v === f.pay)?.label}</span>
                )}
                {active === s && ((s === "niche" && text) || (s === "platform" && f.platform) || (s === "budget" && f.budget) || (s === "pay" && f.pay)) ? (
                  <button
                    aria-label="Clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (s === "niche") {
                        setText("");
                        setF((x) => ({ ...x, q: undefined, cat: undefined }));
                      } else setF((x) => ({ ...x, [s]: undefined }));
                    }}
                    className={cn("absolute top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 hover:bg-line", isLast ? "right-[128px]" : "right-4")}
                  >
                    <X className="size-3" strokeWidth={3} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        <button
          onClick={() => go({ ...f, q: f.q })}
          aria-label="Search"
          className={cn(
            "btn-rausch absolute right-2 flex h-12 items-center justify-center gap-2 rounded-full text-white transition-all duration-300",
            active ? "w-[104px]" : "w-12",
          )}
        >
          <Search className="size-4" strokeWidth={3} />
          {active && <span className="text-[15px] font-semibold">Search</span>}
        </button>
      </div>

      {/* Dropdown panels */}
      {active && <div className="fixed inset-0 z-30" onClick={() => setActive(null)} />}
      {active === "niche" && (
        <div className="absolute top-[78px] left-0 z-40 w-[420px] animate-pop rounded-[32px] bg-white py-6 shadow-panel">
          {suggestions ? (
            <div className="px-4">
              {suggestions.cats.map((c) => (
                <SuggestRow key={c.id} icon={<CategoryIcon c={c.id} className="size-5" />} title={c.label} sub={`${CAMPAIGNS.filter((x) => x.category === c.id).length} open campaigns`} onClick={() => { setText(c.label); go({ ...f, q: undefined, cat: c.id }); }} />
              ))}
              {suggestions.brands.map((c) => (
                <SuggestRow key={c.id} icon={<span className="text-xs font-bold" style={{ color: c.brandColor }}>{c.brandInitials}</span>} title={c.brand} sub={c.title} onClick={() => router.push(`/deals/${c.id}`)} />
              ))}
              {!suggestions.cats.length && !suggestions.brands.length && (
                <SuggestRow icon={<Search className="size-5" />} title={`Search "${text}"`} sub="Across briefs, brands and categories" onClick={() => go({ ...f, q: text })} />
              )}
            </div>
          ) : (
            <div className="px-4">
              <div className="px-4 pb-2 text-xs font-semibold text-ink-2">Suggested for you</div>
              <SuggestRow icon={<AiSpark className="size-5" />} title="Matched for you" sub="AI-ranked by audience fit and your rates" onClick={() => { setText("Matched for you"); go({ ...f, q: undefined, cat: "matched" }); }} />
              <SuggestRow icon={<Zap className="size-5 text-amber" />} title="Pays fast" sub="Paid within 15 days, on time" onClick={() => { setText("Pays fast"); go({ ...f, q: undefined, cat: "fast" }); }} />
              <SuggestRow icon={<CalendarPlus className="size-5 text-sky" />} title="New this week" sub="Fresh campaigns, fewer applicants" onClick={() => { setText("New this week"); go({ ...f, q: undefined, cat: "new" }); }} />
              <SuggestRow icon={<CategoryIcon c="tech" className="size-5" />} title="Tech" sub={`${CAMPAIGNS.filter((x) => x.category === "tech").length} open campaigns · your top niche`} onClick={() => { setText("Tech"); go({ ...f, q: undefined, cat: "tech" }); }} />
              <SuggestRow icon={<CategoryIcon c="education" className="size-5" />} title="Education" sub="Great fit for your newsletter" onClick={() => { setText("Education"); go({ ...f, q: undefined, cat: "education" }); }} />
            </div>
          )}
        </div>
      )}
      {active === "platform" && (
        <div className="absolute top-[78px] left-1/2 z-40 w-[440px] -translate-x-1/2 animate-pop rounded-[32px] bg-white p-6 shadow-panel md:left-[38%]">
          <div className="mb-3 text-base font-semibold">Where will you post?</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setF((x) => ({ ...x, platform: x.platform === p ? undefined : p }))}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-3 text-left text-sm font-medium transition",
                  f.platform === p ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink",
                )}
              >
                <PlatformGlyph platform={p} size={20} />
                {PLATFORMS[p].label}
              </button>
            ))}
          </div>
        </div>
      )}
      {active === "budget" && (
        <PillPanel title="Minimum base fee" className="left-[50%]" options={BUDGETS} value={f.budget} onPick={(v) => setF((x) => ({ ...x, budget: v }))} note="Fees shown are base pay. Bonuses and gifted product come on top." />
      )}
      {active === "pay" && (
        <PillPanel title="Get paid within" className="right-0" options={PAYS} value={f.pay} onPick={(v) => setF((x) => ({ ...x, pay: v }))} note="Based on each brand's real payment history on CreatorAI — not their contract terms." />
      )}
    </div>
  );
}

function SuggestRow({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-left hover:bg-surface">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-ink">{title}</span>
        <span className="block truncate text-sm text-ink-2">{sub}</span>
      </span>
    </button>
  );
}

function PillPanel({
  title,
  options,
  value,
  onPick,
  note,
  className,
}: {
  title: string;
  options: { v: number | undefined; label: string }[];
  value: number | undefined;
  onPick: (v: number | undefined) => void;
  note: string;
  className?: string;
}) {
  return (
    <div className={cn("absolute top-[78px] z-40 w-[380px] animate-pop rounded-[32px] bg-white p-6 shadow-panel", className)}>
      <div className="mb-4 text-base font-semibold">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            onClick={() => onPick(o.v)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              value === o.v ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-4 flex gap-2 text-xs text-ink-2">
        <SparklesIcon className="mt-px size-3.5 shrink-0" />
        {note}
      </p>
    </div>
  );
}
