"use client";

import { useState } from "react";
import { ExternalLink, Plus, Zap } from "lucide-react";
import { BookingRequestCard } from "@/components/studio/packages/BookingRequestCard";
import { CreatorCoverCard } from "@/components/studio/packages/CreatorCover";
import { blankPackage, PackageEditor } from "@/components/studio/packages/PackageEditor";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Media";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { suggestPackagePrice } from "@/lib/logic/pricing";
import { useApp } from "@/lib/store";
import type { Package } from "@/lib/types";
import { cn, money } from "@/lib/utils";

export default function PackagesPage() {
  return (
    <StudioPage wide>
      <Packages />
    </StudioPage>
  );
}

function Packages() {
  const packages = useApp((s) => s.packages);
  const bookings = useApp((s) => s.bookings);
  const deals = useApp((s) => s.deals);
  const profile = useApp((s) => s.profile);
  const [editing, setEditing] = useState<Package | null>(null);
  const pending = bookings.filter((b) => b.status === "pending");
  const packageDeals = deals.filter((d) => d.source === "package");
  const bookedValue = packageDeals.reduce((s, d) => s + d.value, 0);
  const openSlots = packages.filter((p) => p.active).reduce((s, p) => s + Math.max(0, p.slotsPerMonth - p.bookedThisMonth), 0);
  const instantShare = bookings.filter((b) => b.status === "accepted").length ? bookings.filter((b) => b.instant && b.status === "accepted").length / bookings.filter((b) => b.status === "accepted").length : 0;

  return (
    <>
      <PageTitle
        title="Packages"
        sub="Fixed-price sponsorships brands can book from your storefront — paid up front, protected by CreatorCover."
        right={
          <div className="flex gap-2">
            <Button variant="outline" href={`/c/${profile.handle}#packages`}>
              <ExternalLink className="size-4" /> View storefront
            </Button>
            <Button variant="dark" onClick={() => setEditing(blankPackage())}>
              <Plus className="size-4" /> New package
            </Button>
          </div>
        }
      />

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Booked via packages" value={money(bookedValue)} sub={`${packageDeals.length} booking${packageDeals.length === 1 ? "" : "s"}`} />
        <Stat label="Open slots this month" value={`${openSlots}`} sub="across active packages" />
        <Stat label="Instant Book share" value={`${Math.round(instantShare * 100)}%`} sub="of accepted bookings" />
        <Stat label="Platform fee" value="0%" sub="vs 5–15% elsewhere" />
      </div>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[22px] font-semibold">Booking requests · {pending.length}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((b) => (
              <BookingRequestCard key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-4 text-[22px] font-semibold">Your packages</h2>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <PackageTile key={p.id} p={p} onClick={() => setEditing(p)} />
            ))}
            <button onClick={() => setEditing(blankPackage())} className="flex aspect-[20/19] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-ink-2 transition hover:border-ink hover:text-ink">
              <Plus className="size-6" /> Create a package
            </button>
          </div>
        </section>
        <aside className="space-y-6">
          <CreatorCoverCard />
          <div className="rounded-2xl bg-surface p-5 text-sm">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AiSpark className="size-4" /> Why packages?
            </div>
            <p className="text-ink-2">
              Fixed prices end the back-and-forth: brands see exactly what they get, pay before you start, and book an open slot — so your calendar fills without a single negotiation email.
            </p>
          </div>
        </aside>
      </div>

      {editing && <PackageEditor key={editing.id} initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PackageTile({ p, onClick }: { p: Package; onClick: () => void }) {
  const profile = useApp((s) => s.profile);
  const sug = suggestPackagePrice(profile, p);
  const fill = p.bookedThisMonth / p.slotsPerMonth;
  const diff = sug.smart - p.price;
  return (
    <button onClick={onClick} className="group text-left">
      <div className="relative aspect-[20/19] overflow-hidden rounded-2xl">
        <Photo k={p.image} w={600} h={570} className={cn("absolute inset-0 transition-transform duration-500 group-hover:scale-105", !p.active && "grayscale")} />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold shadow">
          {p.active ? (
            p.instantBook ? (
              <>
                <Zap className="size-3.5 fill-ink" /> Instant Book
              </>
            ) : (
              "Request to book"
            )
          ) : (
            "Unlisted"
          )}
        </span>
        <span className="absolute right-3 bottom-3 flex gap-1">
          {Array.from(new Set(p.deliverables.map((d) => d.platform))).map((pl) => (
            <span key={pl} className="flex size-7 items-center justify-center rounded-full bg-white/95 shadow">
              <PlatformGlyph platform={pl} size={14} />
            </span>
          ))}
        </span>
      </div>
      <div className="mt-3 text-[15px]">
        <div className="truncate font-semibold">{p.title}</div>
        <div className="text-ink-2">
          {p.turnaroundDays}-day turnaround · {p.revisions} revision{p.revisions === 1 ? "" : "s"}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span>
            <b>{money(p.smartPricing ? sug.smart : p.price)}</b>
            {p.smartPricing && diff !== 0 && <span className="text-ink-2"> · base {money(p.price)}</span>}
          </span>
          {p.smartPricing && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
              <AiSpark className="size-3" /> Smart pricing
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.min(100, fill * 100)}%` }} />
          </span>
          {p.bookedThisMonth}/{p.slotsPerMonth} booked
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line-soft p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-ink-2">{sub}</div>
    </div>
  );
}

