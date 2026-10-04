import type { Metadata } from "next";
import { Copilot, CopilotLauncher } from "@/components/studio/Copilot";
import { StudioHeader, StudioMobileNav } from "@/components/studio/StudioHeader";

export const metadata: Metadata = { title: "Studio" };

export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <>
      <StudioHeader />
      <div className="pb-24 md:pb-12">{children}</div>
      <CopilotLauncher />
      <Copilot />
      <StudioMobileNav />
    </>
  );
}
