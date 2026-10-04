"use client";

import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { Library } from "@/components/video/Library";
import { SessionGate } from "@/components/video/Session";

export default function LibraryPage() {
  return (
    <StudioPage wide>
      <PageTitle title="Library" sub="Footage, images, audio, documents and exports across your projects — searchable by what is said and shown." />
      <SessionGate>
        <Library />
      </SessionGate>
    </StudioPage>
  );
}
