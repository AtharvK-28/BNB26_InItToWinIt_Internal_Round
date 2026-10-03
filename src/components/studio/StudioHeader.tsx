"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ChevronDown, Link2, Menu, Package, Sparkles, Wallet, Workflow } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Media";
import { Popover } from "@/components/ui/Overlay";
import { useApp, useUi } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/studio", label: "Today", exact: true },
  { href: "/studio/create", label: "Create" },
  { href: "/studio/calendar", label: "Calendar" },
  { href: "/studio/deals", label: "Deals" },
  { href: "/studio/inbox", label: "Inbox" },
];

export function StudioHeader() {
  const pathname = usePathname();
  const unread = useApp((s) => s.threads.filter((t) => t.unread).length);
  const hydrated = useUi((s) => s.hydrated);
  const openCopilot = useUi((s) => s.openCopilot);
  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-white">
      <div className="mx-auto grid h-20 max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr] md:px-6 lg:px-10 xl:px-20">
        <Logo href="/studio" />
        <nav className="hidden h-full items-center justify-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative flex h-full items-center px-4 text-[15px] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                <span className={cn("rounded-full px-0 py-2", !active && "hover:bg-transparent")}>{n.label}</span>
                {n.label === "Inbox" && hydrated && unread > 0 && <span className="ml-1.5 size-1.5 rounded-full bg-rausch" />}
                {active && <span className="absolute right-4 bottom-0 left-4 h-0.5 rounded-full bg-ink" />}
              </Link>
            );
          })}
          <MoreMenu pathname={pathname} />
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link href="/" className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-surface lg:block">
            Switch to Explore
          </Link>
          <button
            onClick={() => openCopilot()}
            className="ai-border flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:shadow-soft"
          >
            <AiSpark className="size-4" />
            <span className="hidden sm:inline">Ask CreatorAI</span>
          </button>
          <StudioMenu />
        </div>
      </div>
    </header>
  );
}

const MORE = [
  { href: "/studio/packages", label: "Packages", sub: "Bookable sponsorships", Icon: Package },
  { href: "/studio/automations", label: "Automations", sub: "Auto-replies & follow-ups", Icon: Workflow },
  { href: "/studio/earnings", label: "Earnings", sub: "Income, forecast & taxes", Icon: Wallet },
  { href: "/studio/insights", label: "Insights", sub: "Growth & Super Creator", Icon: BarChart3 },
  { href: "/c/mayamakes", label: "Media kit", sub: "Your page for brands", Icon: Sparkles },
  { href: "/c/mayamakes/links", label: "Link in bio", sub: "Your page for fans", Icon: Link2 },
];

/** Airbnb hosting-style "Menu" for the less frequent Studio pages. */
function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = MORE.some((m) => pathname.startsWith(m.href) && m.href.startsWith("/studio"));
  const pending = useApp((s) => s.bookings.filter((b) => b.status === "pending").length);
  const hydrated = useUi((s) => s.hydrated);
  return (
    <div className="relative flex h-full items-center">
      <button onClick={() => setOpen((o) => !o)} className={cn("relative flex h-full items-center gap-1 px-4 text-[15px] font-semibold transition-colors", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
        Menu
        {hydrated && pending > 0 && <span className="size-1.5 rounded-full bg-rausch" />}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        {active && <span className="absolute right-4 bottom-0 left-4 h-0.5 rounded-full bg-ink" />}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="top-[72px] left-1/2 w-[440px] -translate-x-1/2 rounded-2xl p-3">
        <div className="grid grid-cols-2 gap-1" onClick={() => setOpen(false)}>
          {MORE.map(({ href, label, sub, Icon }) => (
            <Link key={href} href={href} className="flex items-start gap-3 rounded-xl p-3 hover:bg-surface">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                <Icon className="size-5" />
                {label === "Packages" && hydrated && pending > 0 && <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rausch text-[10px] font-bold text-white">{pending}</span>}
              </span>
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-ink-2">{sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </Popover>
    </div>
  );
}

function StudioMenu() {
  const [open, setOpen] = useState(false);
  const profile = useApp((s) => s.profile);
  const reset = useApp((s) => s.reset);
  const toast = useUi((s) => s.toast);
  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-surface";
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-3 rounded-full border border-line py-1 pr-1 pl-3.5 hover:shadow-soft" aria-label="Menu">
        <Menu className="size-4" strokeWidth={2.5} />
        <Avatar k={profile.avatar} size={32} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="top-14 right-0 w-64 overflow-hidden rounded-xl py-2">
        <div onClick={() => setOpen(false)}>
          <div className="px-4 py-3">
            <div className="font-semibold">{profile.name}</div>
            <div className="text-xs text-ink-2">@{profile.handle}</div>
          </div>
          <hr className="my-1 border-line-soft" />
          <Link href="/studio/earnings" className={`${item} font-semibold`}>
            Earnings
          </Link>
          <Link href="/studio/insights" className={`${item} font-semibold`}>
            Insights
          </Link>
          <Link href={`/c/${profile.handle}`} className={`${item} font-semibold`}>
            Media kit
          </Link>
          <hr className="my-2 border-line-soft" />
          <Link href="/" className={item}>
            Explore brand deals
          </Link>
          <Link href="/onboarding" className={item}>
            Replay onboarding
          </Link>
          <button
            className={item}
            onClick={() => {
              reset();
              toast("Demo data reset to its original state.");
            }}
          >
            Reset demo data
          </button>
        </div>
      </Popover>
    </div>
  );
}

/** Mobile bottom nav for Studio pages. */
export function StudioMobileNav() {
  const pathname = usePathname();
  const items = [...NAV, { href: "/studio/packages", label: "Packages" }, { href: "/studio/automations", label: "Automations" }, { href: "/studio/earnings", label: "Earnings" }, { href: "/studio/insights", label: "Insights" }];
  return (
    <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-line-soft bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((n) => {
        const active = "exact" in n && n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={cn("flex-1 shrink-0 px-3 py-4 text-center text-xs font-semibold", active ? "text-rausch" : "text-ink-2")}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
