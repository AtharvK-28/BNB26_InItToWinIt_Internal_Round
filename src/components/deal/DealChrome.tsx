"use client";

import { useEffect, useState } from "react";
import { Heart, Share } from "lucide-react";
import { useApp, useUi } from "@/lib/store";
import { cn, money } from "@/lib/utils";

export function SaveShare({ id }: { id: string }) {
  const saved = useApp((s) => s.saved.includes(id));
  const hydrated = useUi((s) => s.hydrated);
  const toggle = useApp((s) => s.toggleSave);
  const toast = useUi((s) => s.toast);
  const on = hydrated && saved;
  return (
    <div className="flex gap-1">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href).catch(() => {});
          toast("Link copied to clipboard");
        }}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline underline-offset-2 hover:bg-surface"
      >
        <Share className="size-4" /> Share
      </button>
      <button
        onClick={() => {
          toggle(id);
          toast(on ? "Removed from Saved deals" : "Saved to your deals list");
        }}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline underline-offset-2 hover:bg-surface"
      >
        <Heart className={cn("size-4", on && "fill-rausch text-rausch")} /> {on ? "Saved" : "Save"}
      </button>
    </div>
  );
}

/** Airbnb listing-page sticky section nav, appears once the photos scroll away. */
export function SectionNav({ base, bonus }: { base: number; bonus: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 620);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    ["Photos", "#top"],
    ["Deliverables", "#deliverables"],
    ["Reviews", "#reviews"],
    ["Terms", "#terms"],
  ];
  return (
    <div className={cn("fixed inset-x-0 top-0 z-[60] hidden border-b border-line-soft bg-white transition-transform duration-200 md:block", show ? "translate-y-0" : "-translate-y-full")}>
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-10">
        <nav className="flex h-full gap-6">
          {links.map(([l, h]) => (
            <a key={l} href={h} className="flex h-full items-center border-b-4 border-transparent text-sm font-semibold hover:border-ink">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-semibold">
              {money(base)} <span className="font-normal text-ink-2">base</span>
            </div>
            {bonus > 0 && <div className="text-xs text-ink-2">+ up to {money(bonus)} bonus</div>}
          </div>
          <a href="#pitch" className="btn-rausch rounded-lg px-6 py-3 text-[15px] font-semibold">
            Pitch with AI
          </a>
        </div>
      </div>
    </div>
  );
}
