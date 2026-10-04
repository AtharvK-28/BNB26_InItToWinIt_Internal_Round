"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { CATEGORIES, PLATFORMS } from "@/lib/data/meta";
import { toQuery, type DealFilters } from "@/lib/filters";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Airbnb-mobile-style search: stacked cards, one expanded at a time. */
export function MobileSearch({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: DealFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState<DealFilters>(initial);
  const [step, setStep] = useState<"niche" | "platform" | "budget">("niche");
  if (!open || typeof document === "undefined") return null;

  const card = (s: typeof step, title: string, summary: string, body: React.ReactNode) =>
    step === s ? (
      <div className="animate-pop rounded-3xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        {body}
      </div>
    ) : (
      <button onClick={() => setStep(s)} className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm shadow-soft">
        <span className="text-ink-2">{title.replace("?", "")}</span>
        <span className="font-semibold">{summary}</span>
      </button>
    );

  return createPortal(
    <div className="fixed inset-0 z-[120] flex animate-fade-in flex-col bg-surface">
      <div className="flex items-center px-4 pt-4">
        <button onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full border border-line bg-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {card(
          "niche",
          "What do you create?",
          f.q || (f.cat ? CATEGORIES.find((c) => c.id === f.cat)?.label ?? "Matched" : "Any niche"),
          <>
            <div className="mb-4 flex h-14 items-center gap-3 rounded-xl border border-line px-4">
              <Search className="size-4" />
              <input
                autoFocus
                placeholder="Search brands or topics"
                defaultValue={f.q}
                onChange={(e) => setF((x) => ({ ...x, q: e.target.value || undefined }))}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.slice(0, 9).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setF((x) => ({ ...x, cat: x.cat === c.id ? undefined : c.id }));
                    setStep("platform");
                  }}
                  className={cn("flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium", f.cat === c.id ? "border-ink ring-1 ring-ink" : "border-line")}
                >
                  <CategoryIcon c={c.id} className="size-6" />
                  {c.label}
                </button>
              ))}
            </div>
          </>,
        )}
        {card(
          "platform",
          "Where will you post?",
          f.platform ? PLATFORMS[f.platform].label : "Any platform",
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setF((x) => ({ ...x, platform: x.platform === p ? undefined : p }));
                  setStep("budget");
                }}
                className={cn("flex items-center gap-3 rounded-xl border p-3 text-sm font-medium", f.platform === p ? "border-ink ring-1 ring-ink" : "border-line")}
              >
                <PlatformGlyph platform={p} size={18} />
                {PLATFORMS[p].label}
              </button>
            ))}
          </div>,
        )}
        {card(
          "budget",
          "Minimum budget?",
          f.budget ? `$${f.budget.toLocaleString()}+` : "Any",
          <div className="flex flex-wrap gap-2">
            {[undefined, 2000, 3500, 5000].map((b) => (
              <button
                key={String(b)}
                onClick={() => setF((x) => ({ ...x, budget: b }))}
                className={cn("rounded-full border px-4 py-2 text-sm font-medium", f.budget === b ? "border-ink bg-ink text-white" : "border-line")}
              >
                {b ? `$${b.toLocaleString()}+` : "Any"}
              </button>
            ))}
          </div>,
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line-soft bg-white px-6 py-4">
        <button onClick={() => setF({})} className="text-sm font-semibold underline">
          Clear all
        </button>
        <button
          onClick={() => {
            onClose();
            router.push(`${pathname}${toQuery(f)}`);
          }}
          className="btn-rausch flex h-12 items-center gap-2 rounded-lg px-6 font-semibold"
        >
          <Search className="size-4" strokeWidth={3} />
          Search
        </button>
      </div>
    </div>,
    document.body,
  );
}
