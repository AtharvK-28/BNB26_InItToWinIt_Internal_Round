"use client";

import { useState } from "react";
import { BadgeDollarSign, MessageCircle, Palette, Repeat, Scale, ScrollText, Star } from "lucide-react";
import { Stars } from "@/components/ui/Controls";
import { Avatar } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import type { BrandReview, Campaign } from "@/lib/types";
import { Laurel } from "./Laurel";

const CATS = [
  { key: "payment", label: "Payment speed", Icon: BadgeDollarSign },
  { key: "communication", label: "Communication", Icon: MessageCircle },
  { key: "freedom", label: "Creative freedom", Icon: Palette },
  { key: "fairness", label: "Fair terms", Icon: Scale },
  { key: "clarity", label: "Brief clarity", Icon: ScrollText },
  { key: "again", label: "Would work again", Icon: Repeat },
] as const;

export function ReviewsSection({ c }: { c: Campaign }) {
  const [all, setAll] = useState(false);
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-line-soft py-12">
      {c.creatorFavorite ? (
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-1">
            <Laurel size={84} className="text-ink" />
            <span className="text-[72px] leading-none font-semibold tracking-tight md:text-[88px]">{c.rating.toFixed(2)}</span>
            <Laurel side="right" size={84} className="text-ink" />
          </div>
          <h2 className="mt-2 text-[22px] font-semibold">Creator favorite</h2>
          <p className="mt-1 max-w-xs text-ink-2">One of the most loved brands on CreatorAI, based on ratings, reviews and payment reliability</p>
        </div>
      ) : (
        <h2 className="mb-8 flex items-center gap-2 text-[22px] font-semibold">
          <Star className="size-5 fill-ink" /> {c.rating.toFixed(2)} · {c.reviewCount} creator reviews
        </h2>
      )}

      <div className="mb-10 grid grid-cols-2 gap-y-6 border-line-soft md:grid-cols-6 md:divide-x md:divide-line-soft">
        {CATS.map(({ key, label, Icon }) => (
          <div key={key} className="flex flex-col gap-1 md:px-5 md:first:pl-0">
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-lg font-semibold">{c.ratings[key].toFixed(1)}</span>
            <Icon className="mt-3 hidden size-8 md:block" strokeWidth={1.3} />
          </div>
        ))}
      </div>

      <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
        {c.reviews.slice(0, 6).map((r) => (
          <ReviewItem key={r.id} r={r} />
        ))}
      </div>
      <button onClick={() => setAll(true)} className="mt-10 rounded-lg bg-surface-2 px-6 py-3 text-[15px] font-semibold hover:bg-line-soft">
        Show all {c.reviewCount} reviews
      </button>

      <Modal open={all} onClose={() => setAll(false)} title={`${c.reviewCount} reviews`} width={880}>
        <div className="space-y-10 p-6 md:p-10">
          {[...c.reviews, ...c.reviews].map((r, i) => (
            <ReviewItem key={`${r.id}-${i}`} r={r} />
          ))}
          <p className="text-center text-sm text-ink-2">Showing recent reviews · ratings only from creators who completed a paid deal</p>
        </div>
      </Modal>
    </section>
  );
}

function ReviewItem({ r }: { r: BrandReview }) {
  const [more, setMore] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar k={r.avatar} size={48} />
        <div>
          <div className="font-semibold">{r.author}</div>
          <div className="text-sm text-ink-2">{r.meta}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <Stars value={r.rating} size={10} />
        <span className="font-semibold">·</span>
        <span className="font-semibold">{r.date}</span>
        <span className="text-ink-2">· Completed paid deal</span>
      </div>
      <p className={more ? "mt-2" : "mt-2 line-clamp-3"}>{r.text}</p>
      {r.text.length > 140 && !more && (
        <button onClick={() => setMore(true)} className="mt-1 font-semibold underline underline-offset-2">
          Show more
        </button>
      )}
    </div>
  );
}
