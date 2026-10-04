"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Globe, Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { type DealFilters, toQuery } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { MobileSearch } from "./MobileSearch";
import { SearchBar } from "./SearchBar";
import { CollabsIcon, DealsIcon, NewBadge, ServicesIcon } from "./TabIcons";
import { UserMenu } from "./UserMenu";

export type ExploreTab = "deals" | "collabs" | "services";

const TABS: { id: ExploreTab; label: string; href: string; Icon: typeof DealsIcon; isNew?: boolean }[] = [
  { id: "deals", label: "Brand deals", href: "/deals", Icon: DealsIcon },
  { id: "collabs", label: "Collabs", href: "/collabs", Icon: CollabsIcon, isNew: true },
  { id: "services", label: "Services", href: "/services", Icon: ServicesIcon, isNew: true },
];

function useScrolled(onTop: () => void, threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => {
      const s = window.scrollY > threshold;
      setScrolled(s);
      if (!s) onTop();
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold, onTop]);
  return scrolled;
}

export function ExploreHeader({
  tab,
  filters = {},
  showSearch = true,
  sticky = true,
  children,
}: {
  tab?: ExploreTab;
  filters?: DealFilters;
  showSearch?: boolean;
  sticky?: boolean;
  /** Rendered inside the sticky header, below the search (e.g. the category bar). */
  children?: ReactNode;
}) {
  const [forceOpen, setForceOpen] = useState(false);
  const resetOpen = useCallback(() => setForceOpen(false), []);
  const scrolled = useScrolled(resetOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const compact = showSearch && scrolled && !forceOpen;
  const segments = tab === "deals" || !tab ? undefined : (["niche", "platform"] as const);
  const qkey = toQuery(filters);

  return (
    <>
      {forceOpen && scrolled && <div className="fixed inset-0 z-40 animate-fade-in bg-black/25" onClick={() => setForceOpen(false)} />}
      <header className={cn("z-50 border-b border-line-soft bg-white", sticky ? "sticky top-0" : "relative")}>
        {/* Desktop */}
        <div className="mx-auto hidden max-w-[1760px] px-6 md:block lg:px-10 xl:px-20">
          <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Logo />
            <div className="flex justify-center">
              {compact ? (
                <SearchBar key={`c${qkey}`} initial={filters} compact onExpand={() => setForceOpen(true)} segments={segments ? [...segments] : undefined} />
              ) : (
                <nav className="flex items-center gap-2">
                  {TABS.map((t) => (
                    <Link
                      key={t.id}
                      href={t.href}
                      className={cn(
                        "group relative flex h-20 items-center gap-2 px-3 text-[15px] font-semibold transition-colors",
                        tab === t.id ? "text-ink" : "text-ink-2 hover:text-ink",
                      )}
                    >
                      <span className="relative transition-transform duration-300 group-hover:scale-110">
                        <t.Icon size={tab === t.id ? 44 : 40} />
                        {t.isNew && <NewBadge />}
                      </span>
                      {t.label}
                      <span className={cn("absolute right-3 bottom-0 left-3 h-[3px] rounded-full bg-ink transition-opacity", tab === t.id ? "opacity-100" : "opacity-0")} />
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center justify-end gap-1">
              <Link href="/studio" className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-surface lg:block">
                Switch to Studio
              </Link>
              <button aria-label="Language and currency" className="hidden size-11 items-center justify-center rounded-full hover:bg-surface lg:flex">
                <Globe className="size-[18px]" />
              </button>
              <UserMenu />
            </div>
          </div>
          {showSearch && !compact && (
            <div className={cn("pb-6", forceOpen && "animate-fade-in")}>
              <SearchBar key={`e${qkey}`} initial={filters} segments={segments ? [...segments] : undefined} />
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="px-4 pt-3 md:hidden">
          {showSearch ? (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-line-soft bg-white text-sm font-semibold shadow-card"
            >
              <Search className="size-4" strokeWidth={2.5} />
              {filters.q || (tab === "collabs" ? "Find collaborators" : tab === "services" ? "Find creative services" : "Find brand deals")}
            </button>
          ) : (
            <div className="flex h-12 items-center justify-between">
              <Logo />
              <UserMenu />
            </div>
          )}
          {tab && (
            <nav className="mt-2 grid grid-cols-3">
              {TABS.map((t) => (
                <Link key={t.id} href={t.href} className={cn("relative flex flex-col items-center gap-1 pb-3 text-xs font-semibold", tab === t.id ? "text-ink" : "text-ink-2")}>
                  <span className="relative">
                    <t.Icon size={34} />
                    {t.isNew && <NewBadge />}
                  </span>
                  {t.label}
                  {tab === t.id && <span className="absolute right-6 bottom-0 left-6 h-[3px] rounded-full bg-ink" />}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {children}
      </header>
      <MobileSearch key={qkey} open={mobileOpen} onClose={() => setMobileOpen(false)} initial={filters} />
    </>
  );
}
