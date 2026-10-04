"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { WhenHydrated } from "@/components/Providers";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { ListingCard } from "@/components/explore/ListingCard";
import { MobileNav } from "@/components/explore/MobileNav";
import { CAMPAIGNS } from "@/lib/data/campaigns";
import { useApp } from "@/lib/store";

export default function SavedPage() {
  return (
    <>
      <ExploreHeader showSearch={false} />
      <main className="mx-auto min-h-[60vh] max-w-[1760px] px-4 py-10 md:px-6 lg:px-10 xl:px-20">
        <h1 className="mb-8 text-[32px] font-semibold tracking-tight">Saved deals</h1>
        <WhenHydrated fallback={<div className="skeleton h-72 w-72 rounded-2xl" />}>
          <SavedGrid />
        </WhenHydrated>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}

function SavedGrid() {
  const saved = useApp((s) => s.saved);
  const items = CAMPAIGNS.filter((c) => saved.includes(c.id));
  if (!items.length)
    return (
      <div className="max-w-md">
        <h2 className="text-[22px] font-semibold">Save the deals you love</h2>
        <p className="mt-2 text-ink-2">
          Tap the <Heart className="inline size-4" /> on any brand deal to save it here — we&apos;ll tell you before the application window closes.
        </p>
        <Link href="/deals" className="mt-6 inline-flex rounded-lg bg-ink px-6 py-3 font-semibold text-white">
          Start exploring
        </Link>
      </div>
    );
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {items.map((c) => (
        <ListingCard key={c.id} c={c} />
      ))}
    </div>
  );
}
