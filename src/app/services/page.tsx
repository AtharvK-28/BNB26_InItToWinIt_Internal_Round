import type { Metadata } from "next";
import { ServiceGrid } from "@/components/explore/CommunityGrids";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { MobileNav } from "@/components/explore/MobileNav";
import { SERVICES } from "@/lib/data/community";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage(props: PageProps<"/services">) {
  const f = parseFilters(await props.searchParams);
  const items = SERVICES.filter((s) => !f.q || `${s.service} ${s.name}`.toLowerCase().includes(f.q.toLowerCase()));
  return (
    <>
      <ExploreHeader tab="services" filters={f} />
      <main className="mx-auto max-w-[1760px] px-4 py-8 md:px-6 lg:px-10 xl:px-20">
        <h1 className="mb-1 text-[22px] font-semibold">Hire vetted creative help</h1>
        <p className="mb-6 text-sm text-ink-2">Editors, designers, managers and more — paid through escrow, reviewed by creators.</p>
        {items.length ? <ServiceGrid items={items} /> : <p className="text-ink-2">No services match “{f.q}”.</p>}
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
