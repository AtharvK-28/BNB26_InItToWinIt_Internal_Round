import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhenHydrated } from "@/components/Providers";
import { LinkInBio } from "@/components/storefront/LinkInBio";
import { CREATOR } from "@/lib/data/creator";

export const metadata: Metadata = { title: `${CREATOR.name} — links` };

export function generateStaticParams() {
  return [{ handle: CREATOR.handle }];
}

export default async function LinksPage(props: PageProps<"/c/[handle]/links">) {
  const { handle } = await props.params;
  if (handle !== CREATOR.handle) notFound();
  return (
    <WhenHydrated fallback={<div className="min-h-dvh bg-[#fff6f8]" />}>
      <LinkInBio />
    </WhenHydrated>
  );
}
