"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Media";
import { Popover } from "@/components/ui/Overlay";
import { useApp, useUi } from "@/lib/store";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const profile = useApp((s) => s.profile);
  const unread = useApp((s) => s.threads.filter((t) => t.unread).length);
  const hydrated = useUi((s) => s.hydrated);
  const reset = useApp((s) => s.reset);
  const toast = useUi((s) => s.toast);

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-surface";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-3 rounded-full border border-line py-1 pr-1 pl-3.5 transition hover:shadow-soft"
        aria-label="Open menu"
      >
        <Menu className="size-4" strokeWidth={2.5} />
        <span className="relative">
          <Avatar k={profile.avatar} size={32} />
          {hydrated && unread > 0 && (
            <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full bg-rausch text-[10px] font-bold text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </span>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="top-14 right-0 w-64 overflow-hidden rounded-xl py-2">
        <div onClick={() => setOpen(false)}>
          <Link href="/studio/inbox" className={`${item} flex items-center justify-between font-semibold`}>
            Inbox {hydrated && unread > 0 && <span className="size-2 rounded-full bg-rausch" />}
          </Link>
          <Link href="/saved" className={`${item} font-semibold`}>
            Saved deals
          </Link>
          <Link href="/studio" className={`${item} font-semibold`}>
            Studio
          </Link>
          <Link href={`/c/${profile.handle}`} className={`${item} font-semibold`}>
            Media kit
          </Link>
          <hr className="my-2 border-line-soft" />
          <Link href="/studio/earnings" className={item}>
            Earnings
          </Link>
          <Link href="/studio/insights" className={item}>
            Insights
          </Link>
          <Link href="/onboarding" className={item}>
            Replay onboarding
          </Link>
          <hr className="my-2 border-line-soft" />
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
