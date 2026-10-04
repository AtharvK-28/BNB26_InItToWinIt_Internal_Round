import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhenHydrated } from "@/components/Providers";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { Footer } from "@/components/explore/Footer";
import { MediaKit } from "@/components/MediaKit";
import { CREATOR } from "@/lib/data/creator";

export const metadata: Metadata = { title: `${CREATOR.name} — media kit` };

export function generateStaticParams() {
  return [{ handle: CREATOR.handle }];
}

export default async function MediaKitPage(props: PageProps<"/c/[handle]">) {
  const { handle } = await props.params;
  if (handle !== CREATOR.handle) notFound();
  return (
    <>
      <ExploreHeader showSearch={false} />
      <WhenHydrated fallback={<div className="mx-auto h-[70vh] max-w-[1120px] px-10 py-14"><div className="skeleton h-80 w-80 rounded-3xl" /></div>}>
        <MediaKit />
      </WhenHydrated>
      <Footer />
    </>
  );
}
