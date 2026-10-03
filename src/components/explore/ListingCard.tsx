"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Photo } from "@/components/ui/Media";
import { categoryLabel, PLATFORMS } from "@/lib/data/meta";
import type { ImageKey } from "@/lib/images";
import { useApp, useUi } from "@/lib/store";
import type { Campaign } from "@/lib/types";
import { cn, money } from "@/lib/utils";

/** Photo carousel with Airbnb's hover arrows and dots. */
export function CardCarousel({ images, children, className, rounded = "rounded-2xl" }: { images: ImageKey[]; children?: ReactNode; className?: string; rounded?: string }) {
  const [i, setI] = useState(0);
  const step = (e: MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((x) => Math.min(images.length - 1, Math.max(0, x + d)));
  };
  return (
    <div className={cn("group/car relative aspect-[20/19] overflow-hidden bg-surface-2", rounded, className)}>
      <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {images.map((k, idx) => (
          <Photo key={k + idx} k={k} w={640} h={608} className="h-full w-full shrink-0" loading={idx === 0 ? "eager" : "lazy"} />
        ))}
      </div>
      {i > 0 && (
        <button
          onClick={(e) => step(e, -1)}
          aria-label="Previous photo"
          className="absolute top-1/2 left-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition hover:scale-105 hover:bg-white group-hover/car:opacity-100 md:flex"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
        </button>
      )}
      {i < images.length - 1 && (
        <button
          onClick={(e) => step(e, 1)}
          aria-label="Next photo"
          className="absolute top-1/2 right-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition hover:scale-105 hover:bg-white group-hover/car:opacity-100 md:flex"
        >
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </button>
      )}
      {images.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {images.slice(0, 5).map((_, idx) => (
            <span key={idx} className={cn("size-1.5 rounded-full bg-white transition-opacity", idx === i ? "opacity-100" : "opacity-60")} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export function HeartButton({ id, className }: { id: string; className?: string }) {
  const saved = useApp((s) => s.saved.includes(id));
  const hydrated = useUi((s) => s.hydrated);
  const toggle = useApp((s) => s.toggleSave);
  const toast = useUi((s) => s.toast);
  const on = hydrated && saved;
  return (
    <button
      aria-label={on ? "Remove from saved" : "Save"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
        toast(on ? "Removed from Saved deals" : "Saved to your deals list", on ? undefined : { label: "View", href: "/saved" });
      }}
      className={cn("transition-transform active:scale-90", className)}
    >
      <Heart className={cn("size-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]", on ? "fill-rausch text-white" : "fill-black/50 text-white")} strokeWidth={2} />
    </button>
  );
}

export function ListingCard({ c, size = "grid" }: { c: Campaign; size?: "grid" | "row" }) {
  const showFit = useUi((s) => s.showFit);
  const slowPayer = c.paymentDays >= 45;
  const badge = c.creatorFavorite ? "Creator favorite" : c.isNew ? "New this week" : slowPayer ? `Net-${c.paymentDays} payer` : null;
  return (
    <Link href={`/deals/${c.id}`} className="group block">
      <CardCarousel images={c.images}>
        {badge && (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-3 py-1 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
              slowPayer && !c.creatorFavorite && !c.isNew ? "bg-amber-soft text-amber" : "bg-white/95 text-ink",
            )}
          >
            {badge}
          </span>
        )}
        <HeartButton id={c.id} className="absolute top-3 right-3" />
        {showFit && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold shadow">
            <AiSpark className="size-3.5" />
            {c.fit}% fit
          </span>
        )}
      </CardCarousel>
      <div className={cn("mt-3 text-[15px] leading-5", size === "row" && "text-sm")}>
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-semibold text-ink">
            {c.brand} <span className="font-normal text-ink-2">· {categoryLabel(c.category)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-ink">
            <Star className="size-3 fill-ink" />
            {c.rating.toFixed(2)}
          </span>
        </div>
        <div className="truncate text-ink-2">{c.title}</div>
        <div className="truncate text-ink-2">
          {c.platforms.map((p) => PLATFORMS[p].label).join(" · ")} · Pays in {c.paymentDays}d
        </div>
        <div className="mt-1.5 text-ink">
          <span className="font-semibold">{money(c.base)}</span> <span className="text-ink-2">base</span>
          {c.bonus > 0 && <span className="text-ink-2"> · +{money(c.bonus, { compact: true })} bonus</span>}
        </div>
      </div>
    </Link>
  );
}
