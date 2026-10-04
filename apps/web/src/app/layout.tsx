import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "CreatorAI — the operating system for creators",
    template: "%s · CreatorAI",
  },
  description:
    "Find fairly-paid brand deals, plan content without burning out, and let AI handle pitches, contracts, invoices and your inbox — all in one place.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
