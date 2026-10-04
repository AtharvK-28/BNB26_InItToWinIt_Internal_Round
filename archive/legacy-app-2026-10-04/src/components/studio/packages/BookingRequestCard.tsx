"use client";

import { Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/Media";
import { useApp, useUi } from "@/lib/store";
import type { BookingRequest } from "@/lib/types";
import { cn, fmtDate, money } from "@/lib/utils";

/** Airbnb-style "request to book" with a 24-hour response window. */
export function BookingRequestCard({ b, compact }: { b: BookingRequest; compact?: boolean }) {
  const pkg = useApp((s) => s.packages.find((p) => p.id === b.packageId));
  const respond = useApp((s) => s.respondBooking);
  const toast = useUi((s) => s.toast);
  const hoursLeft = Math.max(0, Math.round(24 - (Date.now() - new Date(b.createdAt).getTime()) / 3_600_000));
  return (
    <div className={cn("flex flex-col rounded-2xl border border-line bg-white", compact ? "w-[340px] shrink-0 snap-start" : "")}>
      <div className="flex items-start gap-4 p-5">
        <BrandLogo initials={b.brandInitials} color={b.brandColor} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber">
            <Clock className="size-4" /> Request to book · respond within {hoursLeft}h
          </div>
          <div className="mt-1 text-[17px] font-semibold">{b.brand}</div>
          <div className="flex items-center gap-1 text-sm text-ink-2">
            <Star className="size-3 fill-ink text-ink" /> {b.brandRating.toFixed(1)} brand trust · pays via CreatorCover
          </div>
        </div>
      </div>
      <div className="mx-5 rounded-xl bg-surface p-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="font-semibold">{pkg?.title ?? "Package"}</span>
          <span className="font-semibold">{money(b.price)}</span>
        </div>
        <div className="mt-0.5 text-ink-2">Go-live {fmtDate(b.goLive, { month: "short", day: "numeric" })}</div>
        <p className={cn("mt-2 text-ink", compact && "line-clamp-2")}>“{b.brief}”</p>
      </div>
      <div className="mt-auto flex gap-2 p-5">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            respond(b.id, false);
            toast(`Declined ${b.brand}'s request. We let them know kindly.`);
          }}
        >
          Decline
        </Button>
        <Button
          variant="dark"
          className="flex-1"
          onClick={() => {
            const dealId = respond(b.id, true);
            toast(`Booked! ${money(b.price)} is now held in CreatorCover.`, dealId ? { label: "Open deal", href: `/studio/deals?open=${dealId}` } : undefined);
          }}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
