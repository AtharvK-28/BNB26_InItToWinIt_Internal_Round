"use client";

import type { ReactNode } from "react";
import { StudioPage } from "@/components/studio/Shell";
import { SessionGate } from "./Session";

/** Wrapper for the four project stages: Studio chrome + sign-in gate (cloud mode). */
export function ProjectPage({ children }: { children: ReactNode }) {
  return (
    <StudioPage wide>
      <SessionGate>{children}</SessionGate>
    </StudioPage>
  );
}
