"use client";

import { useState } from "react";
import { BadgeCheck, Briefcase, Check, Globe, Mail, MapPin, Sparkles, Star, TrendingUp, Wand2 } from "lucide-react";
import { StorefrontPackages } from "@/components/storefront/Packages";
import { AiSpark, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Controls";
import { Avatar, BrandLogo, Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformBadge } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { avgEngagement, totalFollowers } from "@/lib/data/creator";
import { categoryLabel, PLATFORMS } from "@/lib/data/meta";
import type { ImageKey } from "@/lib/images";
import { estimateRate } from "@/lib/logic/rate";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Deliverable } from "@/lib/types";
import { compact, money } from "@/lib/utils";

const BRAND_REVIEWS: { brand: string; initials: string; color: string; person: string; avatar: ImageKey; date: string; text: string }[] = [
  { brand: "Halo Desk Co.", initials: "HD", color: "#7c5c3b", person: "Marcus, Head of Influencer", avatar: "pMarcus", date: "August 2026", text: "Maya's desk makeover drove our best week of the summer. She pushed back on one talking point that didn't feel true to her — and she was right. The video converted 3× our benchmark." },
  { brand: "Brightpath Academy", initials: "BA", color: "#2563eb", person: "Grace, Partnerships", avatar: "pGrace", date: "July 2026", text: "Clear communication, early delivery, and the most honest integration we've run. Her newsletter alone drove more signups than two other creators combined." },
  { brand: "Pixelpad", initials: "PP", color: "#9333ea", person: "Isla, Community Lead", avatar: "pIsla", date: "September 2026", text: "We approved the concept in one round. Only 6% of viewers dropped during the integration — she knows how to make a sponsor segment feel like content." },
  { brand: "Ledgerly", initials: "L", color: "#15803d", person: "Omar, Growth", avatar: "pOmar", date: "September 2026", text: "Professional from pitch to report. She shared a full performance breakdown we used in our board deck." },
];

const PAST: { brand: string; initials: string; color: string; thumb: ImageKey; title: string; result: string }[] = [
  { brand: "Halo Desk Co.", initials: "HD", color: "#7c5c3b", thumb: "deskWindow", title: "Summer desk refresh", result: "612K views · 3.1× benchmark CTR" },
  { brand: "Pixelpad", initials: "PP", color: "#9333ea", thumb: "uiDesign", title: "My creative workflow", result: "186K views · 94% stayed through the ad" },
  { brand: "Brightpath Academy", initials: "BA", color: "#2563eb", thumb: "codeLaptop", title: "Back-to-school coding sprint", result: "1,140 signups · 12% newsletter CTR" },
];

const RATE_ITEMS: Deliverable[] = [
  { platform: "youtube", label: "60–90s integration", qty: 1 },
  { platform: "youtube", label: "Dedicated video", qty: 1 },
  { platform: "youtube", label: "YouTube Short", qty: 1 },
  { platform: "tiktok", label: "TikTok video", qty: 1 },
  { platform: "instagram", label: "Instagram Reel", qty: 1 },
  { platform: "newsletter", label: "Newsletter feature", qty: 1 },
];

export function MediaKit() {
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [bio, setBio] = useState<string | null>(null);
  const [bioSource, setBioSource] = useState<AiSource>();
  const [bioLoading, setBioLoading] = useState(false);
  const [brief, setBrief] = useState(false);
  const followers = totalFollowers(profile);
  const eng = avgEngagement(profile);
  const years = new Date().getFullYear() - 2020;

  const rewrite = async () => {
    setBioLoading(true);
    try {
      const res = await runAi("bio", { creator: creatorBrief(profile), audience: "mostly 18–34, US/UK/Canada, tech-curious" });
      setBio(res.data.bio);
      setBioSource(res.source);
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-10 md:py-14">
      <div className="grid gap-12 md:grid-cols-[minmax(300px,380px)_1fr] lg:gap-20">
        {/* Left: profile card */}
        <aside className="space-y-8 md:sticky md:top-28 md:h-fit">
          <div className="grid grid-cols-[1.3fr_1fr] items-center gap-4 rounded-3xl bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col items-center text-center">
              <Avatar k={profile.avatar} size={104} verified />
              <h1 className="mt-3 text-[28px] leading-tight font-bold">{profile.firstName}</h1>
              {profile.superCreator && (
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                  <Sparkles className="size-3.5" /> Super Creator
                </span>
              )}
            </div>
            <div className="divide-y divide-line-soft">
              <Stat value={compact(followers)} label="Followers" />
              <Stat value={<>4.97 <Star className="inline size-3.5 fill-ink" /></>} label="Brand rating" />
              <Stat value={`${years}`} label="Years creating" />
            </div>
          </div>

          <div className="rounded-3xl border border-line-soft p-6">
            <h2 className="mb-4 text-[22px] font-semibold">{profile.firstName}&apos;s verified info</h2>
            <ul className="space-y-3 text-[15px]">
              {["Identity", "Email address", `${profile.platforms.filter((p) => p.connected).length} platforms connected (live stats)`, "Payment details", "FTC disclosure training"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <Check className="size-4" strokeWidth={2.5} /> {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-line p-6 shadow-card">
            <h3 className="text-lg font-semibold">Work with {profile.firstName}</h3>
            <p className="mt-1 text-sm text-ink-2">Typically replies within 4 hours · Pays-on-time brands get priority</p>
            <Button variant="rausch" size="lg" className="mt-4 w-full" onClick={() => setBrief(true)}>
              <Mail className="size-4" /> Send a brief
            </Button>
          </div>
        </aside>

        {/* Right: content */}
        <main className="min-w-0">
          <h2 className="text-[32px] font-bold tracking-tight">About {profile.firstName}</h2>
          <ul className="mt-6 grid gap-4 text-[15px] sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <Briefcase className="size-5" strokeWidth={1.5} /> Creates: {profile.niches.map(categoryLabel).join(" & ")}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-5" strokeWidth={1.5} /> Based in {profile.location}
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="size-5" strokeWidth={1.5} /> {(eng * 100).toFixed(1)}% avg. engagement
            </li>
            <li className="flex items-center gap-3">
              <Globe className="size-5" strokeWidth={1.5} /> Audience: US, UK, Canada, India, Germany
            </li>
          </ul>
          <div className="mt-6">
            <p className="text-[15px] leading-7">{bio ?? profile.bio}</p>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={rewrite} disabled={bioLoading} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
                <Wand2 className="size-3.5" /> {bioLoading ? "Writing…" : "Rewrite for brands with AI"}
              </button>
              <SourceBadge source={bioSource} />
            </div>
          </div>

          <StorefrontPackages />

          <section className="mt-12 border-t border-line-soft pt-10">
            <h2 className="mb-6 text-[22px] font-semibold">Audience, live</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {profile.platforms.map((p) => (
                <div key={p.platform} className="rounded-2xl border border-line-soft p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <PlatformBadge platform={p.platform} size={22} /> {PLATFORMS[p.platform].label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold">{compact(p.followers)}</div>
                  <div className="text-xs text-ink-2">
                    {compact(p.avgViews)} avg. {p.platform === "newsletter" ? "opens" : "views"} · {(p.engagement * 100).toFixed(1)}% {p.platform === "newsletter" ? "open rate" : "eng."}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Demo title="Age" items={profile.audience.age} />
              <Demo title="Top countries" items={profile.audience.countries} />
            </div>
          </section>

          <section className="mt-12 border-t border-line-soft pt-10">
            <h2 className="mb-6 flex items-center gap-2 text-[22px] font-semibold">
              <Star className="size-5 fill-ink" /> 4.97 · What brands say
            </h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {BRAND_REVIEWS.map((r) => (
                <article key={r.brand} className="flex w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-line-soft p-6">
                  <Stars value={5} size={10} />
                  <p className="mt-3 line-clamp-5 flex-1 text-[15px] leading-6">“{r.text}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="relative">
                      <Avatar k={r.avatar} size={40} />
                      <BrandLogo initials={r.initials} color={r.color} size={18} className="absolute -right-1 -bottom-1 rounded-md! ring-2 ring-white" />
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold">{r.brand}</div>
                      <div className="text-ink-2">
                        {r.person} · {r.date}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-line-soft pt-10">
            <h2 className="mb-6 text-[22px] font-semibold">Recent partnerships</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {PAST.map((p) => (
                <div key={p.title}>
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <Photo k={p.thumb} w={500} h={500} className="absolute inset-0" />
                    <BrandLogo initials={p.initials} color={p.color} size={32} className="absolute top-3 left-3 rounded-lg! ring-2 ring-white" />
                  </div>
                  <div className="mt-3 font-semibold">{p.brand}</div>
                  <div className="text-sm text-ink-2">{p.title}</div>
                  <div className="text-sm font-semibold">{p.result}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-line-soft pt-10">
            <h2 className="mb-1 text-[22px] font-semibold">Rates</h2>
            <p className="mb-6 flex items-center gap-1.5 text-sm text-ink-2">
              <AiSpark className="size-3.5" /> Calculated from live stats · includes 30 days of organic usage
            </p>
            <ul className="divide-y divide-line-soft rounded-2xl border border-line-soft">
              {RATE_ITEMS.map((d) => (
                <li key={d.label} className="flex items-center justify-between px-5 py-4 text-[15px]">
                  <span className="flex items-center gap-3">
                    <PlatformBadge platform={d.platform} size={24} /> {d.label}
                  </span>
                  <span className="font-semibold">from {money(estimateRate(profile, [d], profile.niches[0]).target)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-2">Paid usage, whitelisting and exclusivity are quoted separately. Packages of 3+ get 10% off.</p>
          </section>
        </main>
      </div>

      <Modal
        open={brief}
        onClose={() => setBrief(false)}
        title={`Send ${profile.firstName} a brief`}
        footer={
          <div className="flex justify-end">
            <Button
              variant="rausch"
              onClick={() => {
                setBrief(false);
                toast(`Brief sent. ${profile.firstName} will see it in their CreatorAI inbox — sorted and summarized.`);
              }}
            >
              Send brief
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {["Brand", "Campaign goal", "Budget (USD)", "Timeline"].map((l) => (
            <label key={l} className="block">
              <span className="mb-1 block text-sm font-semibold">{l}</span>
              <input className="w-full rounded-lg border border-[#b0b0b0] px-3 py-3 text-sm outline-none focus:border-ink" />
            </label>
          ))}
          <p className="flex items-center gap-2 text-xs text-ink-2">
            <BadgeCheck className="size-4" /> Brands with a public payment history get faster replies.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="text-[22px] leading-tight font-bold">{value}</div>
      <div className="text-xs font-semibold">{label}</div>
    </div>
  );
}

function Demo({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.label} className="grid grid-cols-[100px_1fr_36px] items-center gap-3 text-sm">
            <span className="truncate text-ink-2">{i.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${(i.value / max) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{Math.round(i.value * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
