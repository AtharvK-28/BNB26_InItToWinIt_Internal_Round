"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, FolderOpen, Handshake, Inbox, Link2, LogIn, LogOut, Menu, Package, Sparkles, Wallet, Workflow } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Media";
import { Popover } from "@/components/ui/Overlay";
import { signOut, useSession } from "@/components/video/Session";
import { useApp, useUi } from "@/lib/store";
import { cloudMode } from "@/lib/video/supabase";
import { cn } from "@/lib/utils";

/** Production first: the problem statement's idea → footage → clips → publish loop. */
const NAV = [
  { href: "/studio", label: "Today", exact: true },
  { href: "/studio/projects", label: "Projects" },
  { href: "/studio/create", label: "Create" },
  { href: "/studio/calendar", label: "Calendar" },
  { href: "/studio/insights", label: "Insights" },
];

const MORE = [
  { href: "/studio/library", label: "Library", sub: "All footage & exports", Icon: FolderOpen, group: "Production" },
  { href: "/studio/inbox", label: "Inbox", sub: "DMs, email & comments", Icon: Inbox, group: "Production" },
  { href: "/studio/deals", label: "Deals", sub: "Sponsorship pipeline", Icon: Handshake, group: "Business" },
  { href: "/studio/packages", label: "Packages", sub: "Bookable sponsorships", Icon: Package, group: "Business" },
  { href: "/studio/earnings", label: "Earnings", sub: "Income, forecast & taxes", Icon: Wallet, group: "Business" },
  { href: "/studio/automations", label: "Automations", sub: "Auto-replies & follow-ups", Icon: Workflow, group: "Business" },
  { href: "/c/mayamakes", label: "Media kit", sub: "Your page for brands", Icon: Sparkles, group: "Pages" },
  { href: "/c/mayamakes/links", label: "Link in bio", sub: "Your page for fans", Icon: Link2, group: "Pages" },
];

export function StudioHeader() {
  const pathname = usePathname();
  const openCopilot = useUi((s) => s.openCopilot);
  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-white">
      <div className="mx-auto grid h-20 max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr] md:px-6 lg:px-10 xl:px-20">
        <Logo href="/studio" />
        <nav className="hidden h-full items-center justify-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("relative flex h-full items-center px-3 text-[15px] font-semibold transition-colors lg:px-4", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
                {n.label}
                {active && <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-ink lg:right-4 lg:left-4" />}
              </Link>
            );
          })}
          <MoreMenu pathname={pathname} />
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link href="/deals" className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-surface xl:block">
            Brand deals
          </Link>
          <button onClick={() => openCopilot()} className="ai-border flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:shadow-soft">
            <AiSpark className="size-4" />
            <span className="hidden sm:inline">Ask CreatorAI</span>
          </button>
          <StudioMenu />
        </div>
      </div>
    </header>
  );
}

/** Airbnb hosting-style "Menu" for the less frequent Studio pages. */
function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = MORE.some((m) => m.href.startsWith("/studio") && pathname.startsWith(m.href));
  const pending = useApp((s) => s.bookings.filter((b) => b.status === "pending").length);
  const unread = useApp((s) => s.threads.filter((t) => t.unread).length);
  const hydrated = useUi((s) => s.hydrated);
  const badge = (label: string) => (!hydrated ? 0 : label === "Packages" ? pending : label === "Inbox" ? unread : 0);
  const groups = ["Production", "Business", "Pages"];
  return (
    <div className="relative flex h-full items-center">
      <button onClick={() => setOpen((o) => !o)} className={cn("relative flex h-full items-center gap-1 px-3 text-[15px] font-semibold transition-colors lg:px-4", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
        Menu
        {hydrated && pending + unread > 0 && <span className="size-1.5 rounded-full bg-rausch" />}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        {active && <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-ink" />}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="top-[72px] left-1/2 w-[460px] -translate-x-1/2 rounded-2xl p-3">
        <div onClick={() => setOpen(false)}>
          {groups.map((g) => (
            <div key={g} className="mb-1 last:mb-0">
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wide text-ink-3 uppercase">{g}</div>
              <div className="grid grid-cols-2 gap-1">
                {MORE.filter((m) => m.group === g).map(({ href, label, sub, Icon }) => (
                  <Link key={href} href={href} className="flex items-start gap-3 rounded-xl p-3 hover:bg-surface">
                    <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                      <Icon className="size-5" />
                      {badge(label) > 0 && <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rausch text-[10px] font-bold text-white">{badge(label)}</span>}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-ink-2">{sub}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
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
  const { session } = useSession();
  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-surface";
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-3 rounded-full border border-line py-1 pr-1 pl-3.5 hover:shadow-soft" aria-label="Account menu">
        <Menu className="size-4" strokeWidth={2.5} />
        <Avatar k={profile.avatar} size={32} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="top-14 right-0 w-72 overflow-hidden rounded-xl py-2">
        <div onClick={() => setOpen(false)}>
          <div className="px-4 py-3">
            <div className="font-semibold">{profile.name}</div>
            <div className="truncate text-xs text-ink-2">{session ? session.user.email : cloudMode ? "Not signed in to the video workspace" : "Local video workspace"}</div>
          </div>
          <hr className="my-1 border-line-soft" />
          <Link href="/studio/projects" className={`${item} font-semibold`}>
            Projects
          </Link>
          <Link href="/studio/library" className={`${item} font-semibold`}>
            Library
          </Link>
          <Link href={`/c/${profile.handle}`} className={`${item} font-semibold`}>
            Media kit
          </Link>
          <hr className="my-2 border-line-soft" />
          <Link href="/deals" className={item}>
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
          {cloudMode && (
            <>
              <hr className="my-2 border-line-soft" />
              {session ? (
                <button
                  className={`${item} flex items-center gap-2`}
                  onClick={() => {
                    signOut().then(
                      () => toast("Signed out of the video workspace."),
                      () => toast("Sign out didn't finish — try again."),
                    );
                  }}
                >
                  <LogOut className="size-4" /> Log out
                </button>
              ) : (
                <Link href="/studio/projects" className={`${item} flex items-center gap-2`}>
                  <LogIn className="size-4" /> Log in
                </Link>
              )}
            </>
          )}
        </div>
      </Popover>
    </div>
  );
}

/** Mobile bottom nav for Studio pages. */
export function StudioMobileNav() {
  const pathname = usePathname();
  const items = [...NAV, { href: "/studio/library", label: "Library" }, { href: "/studio/inbox", label: "Inbox" }, { href: "/studio/deals", label: "Deals" }, { href: "/studio/earnings", label: "Earnings" }];
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
