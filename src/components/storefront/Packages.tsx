"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { CreatorCoverMark } from "@/components/studio/packages/CreatorCover";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { livePrice } from "@/lib/logic/pricing";
import { useApp, useUi } from "@/lib/store";
import type { Package } from "@/lib/types";
import { cn, daysFromNow, fmtDate, money } from "@/lib/utils";

/** Bookable packages on the public storefront / media kit (brand-facing). */
export function StorefrontPackages() {
  const allPackages = useApp((s) => s.packages);
  const packages = allPackages.filter((p) => p.active);
  const profile = useApp((s) => s.profile);
  const [booking, setBooking] = useState<Package | null>(null);
  return (
    <section id="packages" className="mt-12 scroll-mt-28 border-t border-line-soft pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold">Book {profile.firstName}</h2>
          <p className="text-sm text-ink-2">Fixed prices, open slots, paid securely up front.</p>
        </div>
        <CreatorCoverMark small />
      </div>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
        {packages.map((p) => {
          const left = p.slotsPerMonth - p.bookedThisMonth;
          return (
            <button key={p.id} onClick={() => setBooking(p)} className="group text-left">
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
                <Photo k={p.image} w={700} h={470} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                {p.instantBook && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold shadow">
                    <Zap className="size-3.5 fill-ink" /> Instant Book
                  </span>
                )}
                {left <= 1 && <span className="absolute top-3 right-3 rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white">{left <= 0 ? "Fully booked this month" : "1 slot left"}</span>}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3 text-[15px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.title}</div>
                  <div className="flex items-center gap-1.5 text-ink-2">
                    {Array.from(new Set(p.deliverables.map((d) => d.platform))).map((pl) => (
                      <PlatformGlyph key={pl} platform={pl} size={13} />
                    ))}
                    <span>· {p.turnaroundDays}-day delivery</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <b>{money(livePrice(profile, p))}</b>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {booking && <BookModal key={booking.id} p={booking} onClose={() => setBooking(null)} />}
    </section>
  );
}

function BookModal({ p, onClose }: { p: Package; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const requestBooking = useApp((s) => s.requestBooking);
  const toast = useUi((s) => s.toast);
  const price = livePrice(profile, p);
  const weeks = [...Array(6).keys()].map((i) => p.turnaroundDays + 7 * i);
  const [goLive, setGoLive] = useState(weeks[0]);
  const [brand, setBrand] = useState("");
  const [contact, setContact] = useState("");
  const [brief, setBrief] = useState("");
  const [done, setDone] = useState<"instant" | "request" | null>(null);
  const input = "w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";
  const valid = brand.trim() && contact.trim() && brief.trim();

  const submit = () => {
    const initials = brand.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    requestBooking({
      packageId: p.id,
      brand: brand.trim(),
      brandInitials: initials,
      brandColor: "#334155",
      contact: contact.trim(),
      brief: brief.trim(),
      price,
      goLive: daysFromNow(goLive),
      brandRating: 4.7,
      instant: p.instantBook,
    });
    setDone(p.instantBook ? "instant" : "request");
    toast(p.instantBook ? `Booked ${profile.firstName} — payment held in CreatorCover.` : `Request sent. ${profile.firstName} responds within 24 hours.`, {
      label: "See it in Studio",
      href: p.instantBook ? "/studio/deals" : "/studio/packages",
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={done ? (done === "instant" ? "You're booked" : "Request sent") : p.title}
      width={620}
      footer={
        done ? (
          <div className="flex justify-end">
            <Button variant="dark" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-2">{p.instantBook ? "Charged now · held until you approve" : "You won't be charged until accepted"}</span>
            <Button variant="rausch" size="lg" disabled={!valid} onClick={submit}>
              {p.instantBook ? `Book & pay ${money(price)}` : "Request to book"}
            </Button>
          </div>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-babu-soft">
            <Check className="size-8 text-babu" strokeWidth={3} />
          </span>
          <h3 className="text-[22px] font-semibold">{done === "instant" ? `${profile.firstName} is booked for ${fmtDate(daysFromNow(goLive))}` : "Your request is on its way"}</h3>
          <p className="mt-2 max-w-sm text-ink-2">
            {done === "instant"
              ? `${money(price)} is held in CreatorCover and released when you approve the content. You'll get the draft about ${p.turnaroundDays - 3} days after booking.`
              : `${profile.firstName} will accept or decline within 24 hours. If accepted, you'll pay ${money(price)} into CreatorCover to lock the slot.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6 p-6">
          <div className="flex gap-4">
            <Photo k={p.image} w={240} h={180} className="h-24 w-32 shrink-0 rounded-xl" />
            <div className="text-sm">
              <div className="text-base font-semibold">{p.title}</div>
              <p className="mt-1 text-ink-2">{p.description}</p>
            </div>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {p.deliverables.map((d) => (
              <li key={d.label} className="flex items-center gap-2">
                <PlatformGlyph platform={d.platform} size={15} /> {d.qty > 1 && `${d.qty} × `}
                {d.label}
              </li>
            ))}
            <li className="flex items-center gap-2 text-ink-2">
              <Check className="size-4" /> {p.revisions} revision round{p.revisions === 1 ? "" : "s"} · {p.usage}
            </li>
          </ul>

          <div>
            <div className="mb-2 text-sm font-semibold">Go-live week</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {weeks.map((w) => (
                <button key={w} onClick={() => setGoLive(w)} className={cn("rounded-xl border px-2 py-2.5 text-center text-sm transition", goLive === w ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink")}>
                  <div className="text-xs text-ink-2">{fmtDate(daysFromNow(w), { weekday: "short" })}</div>
                  <div className="font-semibold">{fmtDate(daysFromNow(w), { month: "short", day: "numeric" })}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Brand name" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <input className={input} placeholder="Your name" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <textarea className={cn(input, "resize-none")} rows={3} placeholder="Short brief: product, key message, anything to avoid" value={brief} onChange={(e) => setBrief(e.target.value)} />

          <div className="space-y-2 rounded-xl border border-line-soft p-4 text-[15px]">
            <div className="flex justify-between">
              <span>{p.title}</span>
              <span>{money(price)}</span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>CreatorCover payment protection</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between border-t border-line-soft pt-2 font-semibold">
              <span>Total</span>
              <span>{money(price)}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
