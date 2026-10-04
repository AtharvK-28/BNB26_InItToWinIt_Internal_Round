"use client";

import { Plus } from "lucide-react";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { Button } from "@/components/ui/Button";
import { ProjectsGrid } from "@/components/video/Projects";
import { SessionGate } from "@/components/video/Session";

const STEPS = [
  ["Material", "Import footage — originals stay untouched"],
  ["Story", "Script, hooks and captions with AI"],
  ["Cuts", "The clip agent matches script to footage"],
  ["Deliver", "Platform-ready MP4s + editable packages"],
];

export default function ProjectsPage() {
  return (
    <StudioPage wide>
      <PageTitle
        title="Projects"
        sub="From script and raw footage to platform-ready clips — every AI edit stays editable."
        right={
          <Button variant="dark" href="/studio/projects/new">
            <Plus className="size-4" /> New project
          </Button>
        }
      />
      <ol className="mb-10 grid gap-3 rounded-2xl bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([title, sub], i) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold shadow-soft">{i + 1}</span>
            <span className="text-sm">
              <b className="block">{title}</b>
              <span className="text-ink-2">{sub}</span>
            </span>
          </li>
        ))}
      </ol>
      <SessionGate>
        <ProjectsGrid />
      </SessionGate>
    </StudioPage>
  );
}
