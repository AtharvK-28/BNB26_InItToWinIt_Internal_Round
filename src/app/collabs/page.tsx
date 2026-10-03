import type { Metadata } from "next";
import { CategoryBar } from "@/components/explore/CategoryBar";
import { CollabGrid } from "@/components/explore/CommunityGrids";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { MobileNav } from "@/components/explore/MobileNav";
import { COLLABS } from "@/lib/data/community";
import { parseFilters } from "@/lib/filters";

export const metadata: Metadata = { title: "Collabs" };

export default async function CollabsPage(props: PageProps<"/collabs">) {
  const f = parseFilters(await props.searchParams);
  const items = COLLABS.filter((c) => (!f.cat || c.niche === f.cat) && (!f.platform || c.platform === f.platform) && (!f.q || `${c.name} ${c.lookingFor} ${c.niche}`.toLowerCase().includes(f.q.toLowerCase()))).sort((a, b) => b.overlap - a.overlap);
  return (
    <>
      <ExploreHeader tab="collabs" filters={f}>
        <div className="border-t border-line-soft md:border-t-0">
          <CategoryBar filters={f} showSpecial={false} showFitToggle={false} />
        </div>
      </ExploreHeader>
      <main className="mx-auto max-w-[1760px] px-4 py-8 md:px-6 lg:px-10 xl:px-20">
        <h1 className="mb-1 text-[22px] font-semibold">Creators who want to collab</h1>
        <p className="mb-6 text-sm text-ink-2">Ranked by audience overlap — enough in common to click, different enough to grow.</p>
        {items.length ? <CollabGrid items={items} /> : <p className="text-ink-2">No collaborators match those filters yet.</p>}
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
