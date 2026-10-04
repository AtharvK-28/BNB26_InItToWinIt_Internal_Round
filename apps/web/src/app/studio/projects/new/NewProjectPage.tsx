"use client";

import { StudioPage } from "@/components/studio/Shell";
import { NewProjectForm } from "@/components/video/Projects";
import { SessionGate } from "@/components/video/Session";

export function NewProjectPage({ title, brief, contentId }: { title: string; brief: string; contentId: string }) {
  return (
    <StudioPage>
      <SessionGate>
        <NewProjectForm initialTitle={title} initialBrief={brief} contentId={contentId} />
      </SessionGate>
    </StudioPage>
  );
}
