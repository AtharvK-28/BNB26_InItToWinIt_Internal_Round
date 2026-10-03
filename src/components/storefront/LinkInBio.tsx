"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BadgeCheck, CalendarDays, Check, Download, Mail, Play } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { Avatar, Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformBadge } from "@/components/ui/PlatformIcon";
import { useApp, useUi } from "@/lib/store";
import { compact } from "@/lib/utils";

type Product = { id: string; title: string; sub: string; price: number; kind: "download" | "booking" };

const PRODUCTS: Product[] = [
  { id: "guide", title: "The Desk Setup Guide", sub: "48-page PDF · every product, price and layout I've tested", price: 19, kind: "download" },
  { id: "consult", title: "1:1 setup consult", sub: "30 minutes on video · I'll redesign your desk with you", price: 79, kind: "booking" },
];

/** Fan-facing link-in-bio storefront: one tap to buy, subscribe or watch — 0% platform fees. */
export function LinkInBio() {
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [email, setEmail] = useState("");
  const [buying, setBuying] = useState<Product | null>(null);
  const [bought, setBought] = useState(false);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#ffe4ea] via-[#fff6f8] to-white px-4 pt-10 pb-16">
      <main className="mx-auto max-w-[480px]">
        <header className="flex flex-col items-center text-center">
          <Avatar k={profile.avatar} size={96} ring />
          <h1 className="mt-3 flex items-center gap-1 text-xl font-bold">
            {profile.name} <BadgeCheck className="size-5 fill-rausch text-white" />
          </h1>
          <p className="text-sm text-ink-2">@{profile.handle}</p>
          <p className="mt-2 max-w-xs text-[15px]">Honest tech reviews & desk setups. Former UX designer. Cable-management evangelist.</p>
          <div className="mt-4 flex gap-2">
            {profile.platforms.map((p) => (
              <span key={p.platform} title={`${compact(p.followers)} on ${p.platform}`}>
                <PlatformBadge platform={p.platform} size={34} />
              </span>
            ))}
          </div>
        </header>

        <div className="mt-8 space-y-3">
          <a href="#" onClick={(e) => e.preventDefault()} className="block overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="relative aspect-video">
              <Photo k="deskWindow" w={900} className="absolute inset-0" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow">
                  <Play className="ml-1 size-6 fill-ink" />
                </span>
              </span>
              <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold">New video</span>
            </div>
            <div className="p-4">
              <div className="font-semibold">Minimal desk tour 2026</div>
              <div className="text-sm text-ink-2">612K views · 3 days ago</div>
            </div>
          </a>

          <LinkRow title="Everything on my desk (with links)" sub="Updated weekly" />

          {PRODUCTS.map((p) => (
            <button key={p.id} onClick={() => setBuying(p)} className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-soft transition hover:shadow-card">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rausch-soft text-rausch">{p.kind === "download" ? <Download className="size-5" /> : <CalendarDays className="size-5" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.title}</span>
                <span className="block text-sm text-ink-2">{p.sub}</span>
              </span>
              <span className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white">${p.price}</span>
            </button>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) return;
              setEmail("");
              toast("You're subscribed to Desk Notes. See you Thursday! 💌");
            }}
            className="rounded-3xl bg-white p-5 shadow-soft"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Mail className="size-4" /> Desk Notes — my weekly newsletter
            </div>
            <p className="mt-1 text-sm text-ink-2">One email a week. The gear I kept, the gear I returned. 31K readers.</p>
            <div className="mt-3 flex gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-ink" />
              <button className="btn-rausch rounded-full px-5 text-sm font-semibold">Subscribe</button>
            </div>
          </form>

          <Link href={`/c/${profile.handle}#packages`} className="flex items-center justify-between rounded-3xl border border-ink/10 bg-white/70 p-4 text-sm font-semibold transition hover:bg-white">
            <span>Brands: work with me</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-ink-2">
          <LogoMark size={18} /> Made with CreatorAI · 0% fees on every sale
        </footer>
      </main>

      <Modal open={Boolean(buying)} onClose={() => { setBuying(null); setBought(false); }} title={bought ? "Thank you!" : "Checkout"} width={440}>
        {buying && (
          <div className="p-6">
            {bought ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-babu-soft">
                  <Check className="size-7 text-babu" strokeWidth={3} />
                </span>
                <div className="text-lg font-semibold">{buying.kind === "download" ? "Your guide is on its way" : "Pick a time in your email"}</div>
                <p className="mt-1 text-sm text-ink-2">Demo checkout — no real payment was taken.</p>
              </div>
            ) : (
              <>
                <div className="font-semibold">{buying.title}</div>
                <p className="text-sm text-ink-2">{buying.sub}</p>
                <div className="mt-5 flex justify-between border-t border-line-soft pt-4 font-semibold">
                  <span>Total</span>
                  <span>${buying.price}.00</span>
                </div>
                <button onClick={() => setBought(true)} className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-ink font-semibold text-white">
                  Pay ${buying.price} — one tap
                </button>
                <p className="mt-3 text-center text-xs text-ink-2">{profile.firstName} keeps 100% (minus card processing).</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function LinkRow({ title, sub }: { title: string; sub: string }) {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-soft transition hover:shadow-card">
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-2">{sub}</span>
      </span>
      <ArrowUpRight className="size-4" />
    </a>
  );
}
