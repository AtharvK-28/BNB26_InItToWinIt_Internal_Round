import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./tokens.css";
import "./globals.css";
import "./refinements.css";
import "./demo.css";
import { Shell } from "@/components/shell";
import { SessionGate, SessionProvider } from "@/components/session";

export const metadata: Metadata = {
  title: "CreatorAi — Your creative workspace",
  description:
    "A space to turn your ideas and footage into stories you can shape.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Shell>
            <SessionGate>{children}</SessionGate>
          </Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
