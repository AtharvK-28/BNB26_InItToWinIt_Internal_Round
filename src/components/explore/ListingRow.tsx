"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Airbnb 2025 home row: title with chevron link, arrow buttons, horizontally scrolling cards. */
export function ListingRow({ title, href, icon, children, subtitle }: { title: string; href?: string; icon?: ReactNode; children: ReactNode; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: true });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth - 80), behavior: "smooth" });
  return (
    <section className="py-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {href ? (
            <Link href={href} className="group inline-flex items-center gap-1.5 text-[22px] font-semibold tracking-tight">
              {icon}
              {title}
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
          ) : (
            <h2 className="inline-flex items-center gap-1.5 text-[22px] font-semibold tracking-tight">
              {icon}
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scroll(-1)}
            disabled={!edges.left}
            aria-label="Scroll left"
            className="flex size-8 items-center justify-center rounded-full bg-surface-2 transition hover:bg-line-soft disabled:opacity-40"
          >
            <ChevronLeft className="size-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!edges.right}
            aria-label="Scroll right"
            className="flex size-8 items-center justify-center rounded-full bg-surface-2 transition hover:bg-line-soft disabled:opacity-40"
          >
            <ChevronRight className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        onScroll={update}
        className={cn(
          "no-scrollbar -mx-4 grid snap-x snap-mandatory auto-cols-[72%] grid-flow-col gap-4 overflow-x-auto scroll-px-4 px-4 sm:auto-cols-[44%] md:mx-0 md:auto-cols-[calc((100%-48px)/4)] md:scroll-px-0 md:px-0 lg:auto-cols-[calc((100%-64px)/5)] 2xl:auto-cols-[calc((100%-96px)/7)]",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function RowItem({ children }: { children: ReactNode }) {
  return <div className="snap-start">{children}</div>;
}
