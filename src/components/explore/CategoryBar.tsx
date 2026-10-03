"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Zap, CalendarPlus } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Toggle } from "@/components/ui/Controls";
import { CATEGORIES } from "@/lib/data/meta";
import { toQuery, type DealFilters } from "@/lib/filters";
import { useUi } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CategoryBar({ filters, showSpecial = true, showFitToggle = true }: { filters: DealFilters; showSpecial?: boolean; showFitToggle?: boolean }) {
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: true });
  const showFit = useUi((s) => s.showFit);
  const setShowFit = useUi((s) => s.setShowFit);

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const items = [
    ...(showSpecial
      ? [
          { id: "matched", label: "Matched", icon: <AiSpark className="size-6" /> },
          { id: "fast", label: "Pays fast", icon: <Zap className="size-6" strokeWidth={1.6} /> },
          { id: "new", label: "New", icon: <CalendarPlus className="size-6" strokeWidth={1.6} /> },
        ]
      : []),
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: <CategoryIcon c={c.id} className="size-6" /> })),
  ];

  const scrollBy = (d: number) => scroller.current?.scrollBy({ left: d, behavior: "smooth" });

  return (
    <div className="mx-auto flex max-w-[1760px] items-center gap-6 px-4 md:px-6 lg:px-10 xl:px-20">
      <div className="relative min-w-0 flex-1">
        {edges.left && (
          <div className="absolute top-0 bottom-0 left-0 z-10 hidden items-center bg-gradient-to-r from-white via-white to-transparent pr-8 md:flex">
            <button onClick={() => scrollBy(-400)} aria-label="Scroll left" className="flex size-7 items-center justify-center rounded-full border border-line bg-white hover:shadow-soft">
              <ChevronLeft className="size-3.5" strokeWidth={3} />
            </button>
          </div>
        )}
        <div ref={scroller} onScroll={update} className="no-scrollbar flex gap-8 overflow-x-auto">
          {items.map((it) => {
            const active = filters.cat === it.id;
            const href = `${pathname}${toQuery({ ...filters, cat: active ? undefined : (it.id as DealFilters["cat"]), q: undefined })}`;
            return (
              <Link
                key={it.id}
                href={href}
                scroll={false}
                className={cn(
                  "group flex shrink-0 flex-col items-center gap-2 pt-3 pb-3 text-xs font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>{it.icon}</span>
                <span className="relative whitespace-nowrap">
                  {it.label}
                  <span
                    className={cn(
                      "absolute -bottom-3 left-0 h-0.5 w-full transition-colors",
                      active ? "bg-ink" : "bg-transparent group-hover:bg-line",
                    )}
                  />
                </span>
              </Link>
            );
          })}
        </div>
        {edges.right && (
          <div className="absolute top-0 right-0 bottom-0 z-10 hidden items-center bg-gradient-to-l from-white via-white to-transparent pl-8 md:flex">
            <button onClick={() => scrollBy(400)} aria-label="Scroll right" className="flex size-7 items-center justify-center rounded-full border border-line bg-white hover:shadow-soft">
              <ChevronRight className="size-3.5" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
      {showFitToggle && (
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            href={`${pathname}${toQuery({ ...filters, sort: filters.sort === "pay" ? undefined : "pay" })}`}
            scroll={false}
            className={cn(
              "flex h-12 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition hover:border-ink",
              filters.sort === "pay" ? "border-ink bg-surface" : "border-line",
            )}
          >
            <SlidersHorizontal className="size-4" />
            {filters.sort === "pay" ? "Highest pay" : "Sort"}
          </Link>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-line px-4 text-xs font-semibold">
            Show AI fit score
            <Toggle size="sm" on={showFit} onChange={setShowFit} label="Show AI fit score" />
          </div>
        </div>
      )}
    </div>
  );
}
