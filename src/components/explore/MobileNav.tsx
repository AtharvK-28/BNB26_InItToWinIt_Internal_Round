"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, Inbox, LayoutGrid, Search } from "lucide-react";
import { useApp, useUi } from "@/lib/store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Explore", Icon: Search, match: (p: string) => p === "/" || p.startsWith("/deals") || p.startsWith("/collabs") || p.startsWith("/services") },
  { href: "/saved", label: "Saved", Icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { href: "/studio", label: "Today", Icon: LayoutGrid, match: (p: string) => p === "/studio" },
  { href: "/studio/calendar", label: "Calendar", Icon: CalendarDays, match: (p: string) => p.startsWith("/studio/calendar") },
  { href: "/studio/inbox", label: "Inbox", Icon: Inbox, match: (p: string) => p.startsWith("/studio/inbox") },
];

/** Airbnb-style bottom tab bar on phones. */
export function MobileNav() {
  const pathname = usePathname();
  const unread = useApp((s) => s.threads.filter((t) => t.unread).length);
  const hydrated = useUi((s) => s.hydrated);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line-soft bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", active ? "text-rausch" : "text-ink-2")}>
              <Icon className="size-6" strokeWidth={active ? 2.2 : 1.6} />
              {label}
              {label === "Inbox" && hydrated && unread > 0 && <span className="absolute top-2 left-1/2 ml-2 size-2 rounded-full bg-rausch" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
