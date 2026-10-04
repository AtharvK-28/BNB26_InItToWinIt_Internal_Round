import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock, Gift, Globe, Palette, Repeat, Shield, Star, Zap, CalendarCheck, Package, Rocket, Send, Wallet } from "lucide-react";
import { DealDescription } from "@/components/deal/DealDescription";
import { SaveShare, SectionNav } from "@/components/deal/DealChrome";
import { Laurel } from "@/components/deal/Laurel";
import { PhotoMosaic } from "@/components/deal/PhotoMosaic";
import { PitchCard } from "@/components/deal/PitchCard";
import { ReviewsSection } from "@/components/deal/Reviews";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { AiSpark } from "@/components/ui/Ai";
import { Avatar, BrandLogo } from "@/components/ui/Media";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { getCampaign } from "@/lib/data/campaigns";
import { categoryLabel, PLATFORMS } from "@/lib/data/meta";
import type { Campaign } from "@/lib/types";
import { cn, compact, daysFromNow, fmtDate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/deals/[id]">): Promise<Metadata> {
  const c = getCampaign((await props.params).id);
  return { title: c ? `${c.brand}: ${c.title}` : "Brand deal" };
}

const HIGHLIGHT_ICONS = { zap: Zap, palette: Palette, shield: Shield, clock: Clock, repeat: Repeat, globe: Globe, gift: Gift };

export default async function DealPage(props: PageProps<"/deals/[id]">) {
  const c = getCampaign((await props.params).id);
  if (!c) notFound();

  return (
    <>
      <ExploreHeader showSearch={false} sticky={false} />
      <SectionNav base={c.base} bonus={c.bonus} />
      <main id="top" className="mx-auto max-w-[1120px] px-4 pt-4 pb-28 md:px-10 md:pt-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-[22px] leading-tight font-semibold md:text-[26px]">
            {c.brand}: {c.title}
          </h1>
          <div className="hidden shrink-0 md:block">
            <SaveShare id={c.id} />
          </div>
        </div>

        <PhotoMosaic images={c.images} title={c.title} />

        <div className="mt-8 grid gap-12 md:grid-cols-[1fr_minmax(320px,372px)] lg:gap-24">
          <div className="min-w-0">
            {/* Overview */}
            <section className="pb-8">
              <h2 className="text-[22px] font-semibold">
                Paid partnership with {c.brand} · {categoryLabel(c.category)}
              </h2>
              <p className="mt-1 text-ink">
                {c.platforms.map((p) => PLATFORMS[p].label).join(" · ")} · {c.deliverables.reduce((s, d) => s + d.qty, 0)} deliverables · {c.spotsLeft} spots left
              </p>
              {!c.creatorFavorite && (
                <p className="mt-1 flex items-center gap-1 font-semibold">
                  <Star className="size-3.5 fill-ink" /> {c.rating.toFixed(2)} · <span className="underline">{c.reviewCount} reviews</span>
                </p>
              )}
            </section>

            {c.creatorFavorite && (
              <a href="#reviews" className="mb-8 flex items-center gap-4 rounded-xl border border-line px-6 py-5 transition hover:shadow-soft">
                <div className="flex items-center gap-0.5">
                  <Laurel size={34} />
                  <span className="text-center text-[15px] leading-4 font-semibold">
                    Creator
                    <br />
                    favorite
                  </span>
                  <Laurel side="right" size={34} />
                </div>
                <p className="hidden flex-1 text-[15px] font-semibold sm:block">One of the most loved brands on CreatorAI, according to creators</p>
                <div className="flex items-center gap-5 text-center">
                  <div>
                    <div className="text-[18px] font-semibold">{c.rating.toFixed(2)}</div>
                    <div className="flex gap-px">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="size-2.5 fill-ink" />
                      ))}
                    </div>
                  </div>
                  <span className="h-10 w-px bg-line" />
                  <div>
                    <div className="text-[18px] font-semibold">{c.reviewCount}</div>
                    <div className="text-xs underline">Reviews</div>
                  </div>
                </div>
              </a>
            )}

            {/* Brand contact */}
            <section className="flex items-center gap-5 border-y border-line-soft py-6">
              <span className="relative">
                <Avatar k={c.manager.avatar} size={44} />
                <BrandLogo initials={c.brandInitials} color={c.brandColor} size={22} className="absolute -right-1 -bottom-1 rounded-md! ring-2 ring-white" />
              </span>
              <div>
                <div className="font-semibold">
                  Managed by {c.manager.name} at {c.brand}
                </div>
                <div className="text-sm text-ink-2">
                  {c.manager.role} · {c.manager.years} years on CreatorAI
                </div>
              </div>
            </section>

            {/* Highlights */}
            <section className="space-y-6 border-b border-line-soft py-8">
              {c.highlights.map((h) => {
                const Icon = HIGHLIGHT_ICONS[h.icon];
                return (
                  <div key={h.title} className="flex gap-6">
                    <Icon className="mt-0.5 size-6 shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold">{h.title}</div>
                      <div className="text-sm text-ink-2">{h.text}</div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* AI fit */}
            <section className="border-b border-line-soft py-8">
              <div className="ai-border rounded-2xl p-6">
                <div className="flex items-start gap-5">
                  <FitRing value={c.fit} />
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <AiSpark className="size-5" /> Why this fits you
                    </h3>
                    <p className="text-sm text-ink-2">Based on your audience, past performance and current deals</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {c.fitReasons.map((r) => {
                    const warning = /^but/i.test(r) || r.includes("block");
                    return (
                      <li key={r} className="flex gap-3 text-[15px]">
                        <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", warning ? "bg-amber-soft text-amber" : "bg-babu-soft text-babu")}>
                          {warning ? <span className="text-xs font-bold">!</span> : <Check className="size-3" strokeWidth={3} />}
                        </span>
                        {r}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <DealDescription text={c.description} brand={c.brand} />

            {/* Deliverables */}
            <section id="deliverables" className="scroll-mt-28 border-b border-line-soft py-8">
              <h2 className="mb-5 text-[22px] font-semibold">What you&apos;ll deliver</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {c.deliverables.map((d) => (
                  <div key={d.label} className="flex items-center gap-4">
                    <PlatformGlyph platform={d.platform} size={24} />
                    <span>
                      {d.qty > 1 && <b>{d.qty} × </b>}
                      {d.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4">
                  <Globe className="size-6" strokeWidth={1.5} />
                  <span>Audience: {c.regions}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Star className="size-6" strokeWidth={1.5} />
                  <span>Minimum {compact(c.minFollowers)} followers</span>
                </div>
              </div>
            </section>

            <Timeline c={c} />
          </div>

          <aside id="pitch" className="scroll-mt-28">
            <div className="md:sticky md:top-28">
              <PitchCard c={c} />
            </div>
          </aside>
        </div>

        <ReviewsSection c={c} />

        {/* Things to know */}
        <section id="terms" className="scroll-mt-28 border-t border-line-soft py-12">
          <h2 className="mb-6 text-[22px] font-semibold">Things to know</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Know
              title="Usage & exclusivity"
              items={[`Usage: ${c.usageRights}`, `Exclusivity: ${c.exclusivity}`, "Up to 2 rounds of revisions"]}
              warn={/perpetual/i.test(c.usageRights) || /90 days/.test(c.exclusivity)}
            />
            <Know
              title="Payment"
              items={[
                `Net-${c.paymentDays} from invoice`,
                `${Math.round(c.onTimeRate * 100)}% of payouts on time (last 12 months)`,
                "Invoices & reminders handled by CreatorAI",
              ]}
              warn={c.paymentDays >= 45}
            />
            <Know title="Cancellation" items={[`Kill fee: ${c.killFee}`, "Free to withdraw your pitch any time", "Disputes mediated by CreatorAI"]} warn={c.killFee === "None"} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FitRing({ value }: { value: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <defs>
          <linearGradient id="fit-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff385c" />
            <stop offset="1" stopColor="#92174d" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ebebeb" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="url(#fit-g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(value / 100) * circ} ${circ}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-bold">{value}</span>
    </div>
  );
}

function Timeline({ c }: { c: Campaign }) {
  const steps = [
    { Icon: Send, label: "Apply by", day: c.applyByDays },
    { Icon: Package, label: "Product ships", day: c.applyByDays + 3 },
    { Icon: CalendarCheck, label: "Concept due", day: Math.round((c.applyByDays + c.goLiveDays) / 2) },
    { Icon: Rocket, label: "Go live", day: c.goLiveDays },
    { Icon: Wallet, label: "Get paid", day: c.goLiveDays + c.paymentDays },
  ];
  return (
    <section className="py-8">
      <h2 className="mb-1 text-[22px] font-semibold">Campaign timeline</h2>
      <p className="mb-6 text-sm text-ink-2">CreatorAI adds every step to your calendar when you&apos;re accepted.</p>
      <ol className="relative grid grid-cols-5 gap-2">
        <span className="absolute top-5 right-[10%] left-[10%] h-0.5 bg-line-soft" />
        {steps.map(({ Icon, label, day }) => (
          <li key={label} className="relative flex flex-col items-center text-center">
            <span className="z-10 flex size-10 items-center justify-center rounded-full border border-line bg-white">
              <Icon className="size-4" />
            </span>
            <span className="mt-2 text-xs font-semibold sm:text-sm">{label}</span>
            <span className="text-xs text-ink-2">{fmtDate(daysFromNow(day))}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Know({ title, items, warn }: { title: string; items: string[]; warn?: boolean }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        {title}
        {warn && <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-bold text-amber">Review carefully</span>}
      </h3>
      <ul className="space-y-3 text-[15px] text-ink">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
