"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash, X } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Media";
import { Sheet } from "@/components/ui/Overlay";
import { PLATFORMS } from "@/lib/data/meta";
import type { ImageKey } from "@/lib/images";
import { suggestPackagePrice } from "@/lib/logic/pricing";
import { USAGE_OPTIONS } from "@/lib/logic/rate";
import { useApp, useUi } from "@/lib/store";
import type { Package, Platform } from "@/lib/types";
import { cn, money } from "@/lib/utils";

const COVERS: ImageKey[] = ["laptopDesk", "deskWindow", "phoneLaptop", "typing", "studioMic", "macbookWood", "cameraLenses", "uiDesign"];

export function blankPackage(): Package {
  return {
    id: `pk-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    description: "",
    image: "laptopDesk",
    deliverables: [{ platform: "youtube", label: "60–90s integration", qty: 1 }],
    category: "tech",
    price: 0,
    turnaroundDays: 21,
    usage: "30 days organic",
    revisions: 2,
    instantBook: false,
    smartPricing: true,
    slotsPerMonth: 3,
    bookedThisMonth: 0,
    active: true,
  };
}

export function PackageEditor({ initial, onClose }: { initial: Package; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const save = useApp((s) => s.savePackage);
  const remove = useApp((s) => s.removePackage);
  const exists = useApp((s) => s.packages.some((p) => p.id === initial.id));
  const toast = useUi((s) => s.toast);
  const [p, setP] = useState<Package>(initial);
  const set = (patch: Partial<Package>) => setP((x) => ({ ...x, ...patch }));
  const sug = useMemo(() => suggestPackagePrice(profile, p), [profile, p]);
  const input = "w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";

  return (
    <Sheet open onClose={onClose} title={exists ? "Edit package" : "New package"} width={600}>
      <div className="space-y-8 px-6 py-6 pb-28">
        <section>
          <div className="mb-2 text-sm font-semibold">Cover photo</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {COVERS.map((k) => (
              <button key={k} onClick={() => set({ image: k })} className={cn("shrink-0 overflow-hidden rounded-xl ring-offset-2", p.image === k && "ring-2 ring-ink")}>
                <Photo k={k} w={160} h={120} className="h-[72px] w-24" />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Title</span>
            <input className={input} value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. YouTube integration (60–90s)" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">What brands get</span>
            <textarea className={cn(input, "resize-none")} rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe the format and why it works for your audience" />
          </label>
        </section>

        <section>
          <div className="mb-2 text-sm font-semibold">Deliverables</div>
          <ul className="space-y-2">
            {p.deliverables.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <select
                  value={d.platform}
                  onChange={(e) => set({ deliverables: p.deliverables.map((x, k) => (k === i ? { ...x, platform: e.target.value as Platform } : x)) })}
                  className="rounded-lg border border-[#b0b0b0] px-2 py-2.5 text-sm outline-none"
                >
                  {(["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter", "podcast"] as Platform[]).map((pl) => (
                    <option key={pl} value={pl}>
                      {PLATFORMS[pl].label}
                    </option>
                  ))}
                </select>
                <input className={cn(input, "flex-1")} value={d.label} onChange={(e) => set({ deliverables: p.deliverables.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                <div className="flex items-center gap-1.5">
                  <button aria-label="Fewer" disabled={d.qty <= 1} onClick={() => set({ deliverables: p.deliverables.map((x, k) => (k === i ? { ...x, qty: x.qty - 1 } : x)) })} className="flex size-7 items-center justify-center rounded-full border border-line disabled:opacity-30">
                    <Minus className="size-3" />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{d.qty}</span>
                  <button aria-label="More" onClick={() => set({ deliverables: p.deliverables.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x)) })} className="flex size-7 items-center justify-center rounded-full border border-line">
                    <Plus className="size-3" />
                  </button>
                </div>
                <button aria-label="Remove" disabled={p.deliverables.length <= 1} onClick={() => set({ deliverables: p.deliverables.filter((_, k) => k !== i) })} className="flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 disabled:opacity-30">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => set({ deliverables: [...p.deliverables, { platform: "tiktok", label: "TikTok video", qty: 1 }] })} className="mt-2 text-sm font-semibold underline underline-offset-2">
            Add a deliverable
          </button>
        </section>

        <section className="rounded-2xl border border-line-soft p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Price</div>
              <div className="text-sm text-ink-2">What brands pay — 100% goes to you</div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[#b0b0b0] px-3 py-2">
              <span className="text-lg font-semibold">$</span>
              <input type="number" step={50} value={p.price || ""} onChange={(e) => set({ price: Number(e.target.value) || 0 })} className="w-24 bg-transparent text-lg font-semibold outline-none" placeholder={String(sug.smart)} />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <div className="mb-2 flex items-center gap-1.5 font-semibold">
              <AiSpark className="size-4" /> Smart price: {money(sug.smart)}
            </div>
            <ul className="space-y-1 text-ink-2">
              <li className="flex justify-between">
                <span>Fair rate for this scope</span>
                <span className="text-ink">{money(sug.base)}</span>
              </li>
              <li className="flex justify-between">
                <span>{sug.season.label}</span>
                <span className="text-ink">× {sug.season.factor.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span>{sug.demand.label}</span>
                <span className="text-ink">× {sug.demand.factor.toFixed(2)}</span>
              </li>
            </ul>
            <button onClick={() => set({ price: sug.smart })} className="mt-3 font-semibold underline underline-offset-2">
              Use {money(sug.smart)}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm">
              <b className="block">Smart pricing</b>
              <span className="text-ink-2">Adjust automatically for season and demand</span>
            </span>
            <Toggle on={p.smartPricing} onChange={(v) => set({ smartPricing: v })} label="Smart pricing" />
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">
              <b className="block">Instant Book</b>
              <span className="text-ink-2">Brands with a 4.5★+ trust score book and pay without waiting for you. Others send a request you answer within 24 hours.</span>
            </span>
            <Toggle on={p.instantBook} onChange={(v) => set({ instantBook: v })} label="Instant Book" />
          </div>
          <Counter label="Slots per month" value={p.slotsPerMonth} set={(v) => set({ slotsPerMonth: v })} min={1} max={12} />
          <Counter label="Turnaround (days)" value={p.turnaroundDays} set={(v) => set({ turnaroundDays: v })} min={3} max={60} step={1} />
          <Counter label="Revision rounds included" value={p.revisions} set={(v) => set({ revisions: v })} min={0} max={3} />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Usage rights</span>
            <select className={input} value={p.usage} onChange={(e) => set({ usage: e.target.value })}>
              {USAGE_OPTIONS.map((u) => (
                <option key={u.id} value={u.label}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Listed on your storefront</span>
            <Toggle on={p.active} onChange={(v) => set({ active: v })} label="Active" />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between border-t border-line-soft bg-white px-6 py-4">
        {exists ? (
          <button
            onClick={() => {
              remove(p.id);
              toast("Package removed");
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2"
          >
            <Trash className="size-3.5" /> Delete
          </button>
        ) : (
          <span />
        )}
        <Button
          variant="dark"
          disabled={!p.title.trim()}
          onClick={() => {
            save({ ...p, price: p.price || sug.smart });
            toast(exists ? "Package updated" : "Package published to your storefront", { label: "Preview", href: `/c/${profile.handle}#packages` });
            onClose();
          }}
        >
          {exists ? "Save" : "Publish package"}
        </Button>
      </div>
    </Sheet>
  );
}

function Counter({ label, value, set, min, max, step = 1 }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button aria-label="Decrease" disabled={value <= min} onClick={() => set(Math.max(min, value - step))} className="flex size-8 items-center justify-center rounded-full border border-[#b0b0b0] disabled:opacity-30">
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center">{value}</span>
        <button aria-label="Increase" disabled={value >= max} onClick={() => set(Math.min(max, value + step))} className="flex size-8 items-center justify-center rounded-full border border-[#b0b0b0] disabled:opacity-30">
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
