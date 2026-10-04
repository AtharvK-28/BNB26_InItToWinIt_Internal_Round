"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Heart, LayoutGrid, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/studio", label: "Today", Icon: LayoutGrid, match: (p: string) => p === "/studio" },
  { href: "/studio/projects", label: "Projects", Icon: Clapperboard, match: (p: string) => p.startsWith("/studio/projects") },
  { href: "/studio/create", label: "Create", Icon: Sparkles, match: (p: string) => p.startsWith("/studio/create") },
  { href: "/deals", label: "Deals", Icon: Search, match: (p: string) => p.startsWith("/deals") || p.startsWith("/collabs") || p.startsWith("/services") },
  { href: "/saved", label: "Saved", Icon: Heart, match: (p: string) => p.startsWith("/saved") },
];

/** Airbnb-style bottom tab bar on phones (marketplace pages). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line-soft bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", active ? "text-rausch" : "text-ink-2")}>
              <Icon className="size-6" strokeWidth={active ? 2.2 : 1.6} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
