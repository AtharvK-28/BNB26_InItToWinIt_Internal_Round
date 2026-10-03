import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarPlus, ShieldCheck, Zap } from "lucide-react";
import { CategoryBar } from "@/components/explore/CategoryBar";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { ListingCard } from "@/components/explore/ListingCard";
import { ListingRow, RowItem } from "@/components/explore/ListingRow";
import { MobileNav } from "@/components/explore/MobileNav";
import { AiSpark } from "@/components/ui/Ai";
import { Photo } from "@/components/ui/Media";
import { CAMPAIGNS } from "@/lib/data/campaigns";
import { categoryLabel } from "@/lib/data/meta";
import { applyFilters, hasFilters, parseFilters, toQuery } from "@/lib/filters";
import type { Category } from "@/lib/types";

export default async function ExplorePage(props: PageProps<"/">) {
  const filters = parseFilters(await props.searchParams);
  const filtered = hasFilters(filters);

  const matched = [...CAMPAIGNS].sort((a, b) => b.fit - a.fit).slice(0, 10);
  const fast = CAMPAIGNS.filter((c) => c.paymentDays <= 15).sort((a, b) => a.paymentDays - b.paymentDays);
  const fresh = CAMPAIGNS.filter((c) => c.isNew);
  const favorites = CAMPAIGNS.filter((c) => c.creatorFavorite);

  return (
    <>
      <ExploreHeader tab="deals" filters={filters}>
        <div className="border-t border-line-soft md:border-t-0">
          <CategoryBar filters={filters} />
        </div>
      </ExploreHeader>

      <main className="mx-auto max-w-[1760px] px-4 pb-8 md:px-6 lg:px-10 xl:px-20">
        {filtered ? (
          <Results filters={filters} />
        ) : (
          <>
            <ListingRow
              title="Matched to your audience"
              href={`/${toQuery({ cat: "matched" })}`}
              icon={<AiSpark className="size-5" />}
              subtitle="Ranked by AI on audience overlap, your past performance and fair pay"
            >
              {matched.map((c) => (
                <RowItem key={c.id}>
                  <ListingCard c={c} size="row" />
                </RowItem>
              ))}
            </ListingRow>

            <TrustStrip />

            <ListingRow title="Pays within 15 days" href={`/${toQuery({ cat: "fast" })}`} subtitle="Based on each brand's real payout history — not what their contract says">
              {fast.map((c) => (
                <RowItem key={c.id}>
                  <ListingCard c={c} size="row" />
                </RowItem>
              ))}
            </ListingRow>

            <StudioPromo />

            <ListingRow title="Creator favorites" subtitle="The brands creators rate highest for payment, freedom and fairness">
              {favorites.map((c) => (
                <RowItem key={c.id}>
                  <ListingCard c={c} size="row" />
                </RowItem>
              ))}
            </ListingRow>

            <ListingRow title="New this week" href={`/${toQuery({ cat: "new" })}`} subtitle="Fewer applicants — pitch early">
              {fresh.map((c) => (
                <RowItem key={c.id}>
                  <ListingCard c={c} size="row" />
                </RowItem>
              ))}
            </ListingRow>

            <section className="pt-8">
              <h2 className="mb-5 text-[22px] font-semibold tracking-tight">All open brand deals</h2>
              <Grid>
                {CAMPAIGNS.map((c) => (
                  <ListingCard key={c.id} c={c} />
                ))}
              </Grid>
            </section>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{children}</div>;
}

function Results({ filters }: { filters: ReturnType<typeof parseFilters> }) {
  const results = applyFilters(filters);
  const label =
    filters.cat === "matched"
      ? "matched to your audience"
      : filters.cat === "fast"
        ? "that pay within 15 days"
        : filters.cat === "new"
          ? "new this week"
          : filters.cat
            ? `in ${categoryLabel(filters.cat as Category)}`
            : filters.q
              ? `for “${filters.q}”`
              : "";
  const sorts = [
    { id: undefined, label: "Best fit" },
    { id: "pay", label: "Highest pay" },
    { id: "fast", label: "Fastest payout" },
    { id: "rating", label: "Top rated" },
  ] as const;
  return (
    <section className="pt-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          {results.length} brand deal{results.length === 1 ? "" : "s"} {label}
        </h1>
        <div className="flex gap-2">
          {sorts.map((s) => (
            <Link
              key={s.label}
              href={`/${toQuery({ ...filters, sort: s.id })}`}
              scroll={false}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
                (filters.sort ?? undefined) === s.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {results.length ? (
        <Grid>
          {results.map((c) => (
            <ListingCard key={c.id} c={c} />
          ))}
        </Grid>
      ) : (
        <div className="rounded-2xl border border-line-soft px-6 py-16 text-center">
          <h2 className="text-[22px] font-semibold">No exact matches</h2>
          <p className="mt-2 text-ink-2">Try changing or removing some of your filters.</p>
          <Link href="/" className="mt-6 inline-flex rounded-lg border border-ink px-5 py-3 text-sm font-semibold hover:bg-surface">
            Remove all filters
          </Link>
        </div>
      )}
    </section>
  );
}

function TrustStrip() {
  const items = [
    { Icon: Zap, title: "Real payout history", text: "See how fast every brand actually pays — 98% on-time or Net-60 surprises, before you pitch." },
    { Icon: ShieldCheck, title: "Contracts checked by AI", text: "Perpetual rights, pay-when-paid and broad exclusivity get flagged with ready-to-send redlines." },
    { Icon: BadgeCheck, title: "0% creator fees", text: "Pitching is free. Brands pay for access — your rate stays yours." },
  ];
  return (
    <section className="my-4 grid gap-4 rounded-2xl bg-surface p-6 md:grid-cols-3 md:p-8">
      {items.map(({ Icon, title, text }) => (
        <div key={title} className="flex gap-4">
          <Icon className="mt-0.5 size-7 shrink-0" strokeWidth={1.5} />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink-2">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function StudioPromo() {
  return (
    <section className="my-6 grid overflow-hidden rounded-3xl bg-ink text-white md:grid-cols-2">
      <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          <CalendarPlus className="size-3.5" /> CreatorAI Studio
        </span>
        <h2 className="text-3xl leading-tight font-bold tracking-tight md:text-[40px]">Your creator business, without the busywork.</h2>
        <p className="max-w-md text-white/75">
          One place for your calendar, deals, inbox and invoices — with an AI that drafts the pitch, flags the contract, chases the late payment and tells you when to rest.
        </p>
        <Link href="/studio" className="btn-rausch inline-flex w-fit items-center gap-2 rounded-lg px-6 py-3.5 font-semibold">
          Open your Studio <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="relative min-h-64">
        <Photo k="deskWindow" w={1100} className="absolute inset-0" />
        <div className="absolute bottom-6 left-6 max-w-72 rounded-2xl bg-white p-4 text-ink shadow-float">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
            <AiSpark className="size-4" /> Today&apos;s brief
          </div>
          <p className="mt-2 text-sm">
            <b>Ledgerly</b> is 9 days late on <b>$3,200</b>. I drafted a friendly reminder — want me to send it?
          </p>
        </div>
      </div>
    </section>
  );
}
