"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { AiSpark, AiThinking } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Avatar, Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { categoryLabel, PLATFORMS } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { CollabListing, ServiceListing } from "@/lib/types";
import { compact, money } from "@/lib/utils";

const GRID = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6";

export function CollabGrid({ items }: { items: CollabListing[] }) {
  const [active, setActive] = useState<CollabListing | null>(null);
  return (
    <>
      <div className={GRID}>
        {items.map((c) => (
          <button key={c.id} onClick={() => setActive(c)} className="group text-left">
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Photo k={c.cover} w={600} h={600} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
              {c.badge && <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold shadow">{c.badge}</span>}
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold shadow">
                <AiSpark className="size-3.5" /> {Math.round(c.overlap * 100)}% audience overlap
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar k={c.avatar} size={36} />
              <div className="min-w-0 flex-1 text-[15px] leading-5">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Star className="size-3 fill-ink" /> {c.rating}
                  </span>
                </div>
                <div className="truncate text-ink-2">
                  {categoryLabel(c.niche)} · {compact(c.followers)} on {PLATFORMS[c.platform].label}
                </div>
              </div>
            </div>
            <div className="mt-1.5 truncate text-[15px]">
              <span className="text-ink-2">Wants:</span> {c.lookingFor}
            </div>
          </button>
        ))}
      </div>
      <CollabModal c={active} onClose={() => setActive(null)} />
    </>
  );
}

function CollabModal({ c, onClose }: { c: CollabListing | null; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  if (!c) return null;
  const write = () => {
    setLoading(true);
    setTimeout(() => {
      setDraft(
        `Hey ${c.name.split(" ")[0]}! I'm ${profile.firstName} (@${profile.handle}) — I make ${profile.niches.join(" & ")} videos. I love your idea: “${c.lookingFor}”.\n\nPitch: we each make one video for our own channel and cross-link them in the first 30 seconds. Our audiences overlap about ${Math.round(c.overlap * 100)}%, so it's new eyes for both of us without feeling random.\n\nFree for a quick call next week?`,
      );
      setLoading(false);
    }, 700);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Propose a collab"
      footer={
        <div className="flex justify-end">
          <Button
            variant="rausch"
            disabled={!draft}
            onClick={() => {
              toast(`Collab request sent to ${c.name}.`, { label: "Inbox", href: "/studio/inbox" });
              onClose();
            }}
          >
            Send request
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar k={c.avatar} size={56} />
          <div>
            <div className="text-lg font-semibold">{c.name}</div>
            <div className="flex items-center gap-1.5 text-sm text-ink-2">
              <PlatformGlyph platform={c.platform} size={14} /> {compact(c.followers)} · {c.location}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-4 text-sm">
          <b>Looking for:</b> {c.lookingFor}
        </div>
        {loading ? (
          <AiThinking label="Writing an intro" />
        ) : draft ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} className="w-full resize-none rounded-xl border border-line p-4 text-sm leading-relaxed outline-none focus:border-ink" />
        ) : (
          <button onClick={write} className="ai-border w-full rounded-2xl p-4 text-left text-sm font-semibold">
            <AiSpark className="mr-2 inline size-4" /> Write my intro message
          </button>
        )}
      </div>
    </Modal>
  );
}

export function ServiceGrid({ items }: { items: ServiceListing[] }) {
  const toast = useUi((s) => s.toast);
  const [active, setActive] = useState<ServiceListing | null>(null);
  return (
    <>
      <div className={GRID}>
        {items.map((s) => (
          <button key={s.id} onClick={() => setActive(s)} className="group text-left">
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Photo k={s.cover} w={600} h={600} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
              {s.badge && <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold shadow">{s.badge}</span>}
              <Avatar k={s.avatar} size={44} ring className="absolute bottom-3 left-3" />
            </div>
            <div className="mt-3 text-[15px] leading-5">
              <div className="truncate font-semibold">{s.service}</div>
              <div className="truncate text-ink-2">
                {s.name} · {s.turnaround}
              </div>
              <div className="mt-1.5">
                From <b>{s.unit.startsWith("%") ? `${s.price}%` : money(s.price)}</b> <span className="text-ink-2">{s.unit.startsWith("%") ? s.unit.slice(1).trim() : s.unit}</span>
                <span className="text-ink-2"> · </span>
                <Star className="inline size-3 fill-ink" /> {s.rating} <span className="text-ink-2">({s.reviews})</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {active && (
        <Modal
          open
          onClose={() => setActive(null)}
          title={active.service}
          footer={
            <div className="flex justify-end">
              <Button
                variant="rausch"
                onClick={() => {
                  toast(`Request sent to ${active.name}. Payment is held until you approve the work.`);
                  setActive(null);
                }}
              >
                Request {active.name.split(" ")[0]}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 p-6">
            <Photo k={active.cover} w={900} className="aspect-video rounded-2xl" />
            <div className="flex items-center gap-3">
              <Avatar k={active.avatar} size={48} verified />
              <div>
                <div className="font-semibold">{active.name}</div>
                <div className="text-sm text-ink-2">
                  ★ {active.rating} · {active.reviews} reviews · {active.turnaround}
                </div>
              </div>
            </div>
            <p className="text-sm text-ink-2">Vetted by CreatorAI. Funds are held in escrow and released when you approve the delivery.</p>
          </div>
        </Modal>
      )}
    </>
  );
}
