"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { computeWorkload } from "@/lib/logic/wellbeing";
import { PLATFORMS } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { cn, daysFromNow, fmtDate } from "@/lib/utils";

export interface ScheduleDraft {
  title: string;
  platform: Platform;
  format: string;
  effort: number;
  notes?: string;
}

/** Pick a day for a new piece of content — days are tinted by planned workload. */
export function ScheduleModal({ draft, onClose }: { draft: ScheduleDraft | null; onClose: () => void }) {
  const addContent = useApp((s) => s.addContent);
  const content = useApp((s) => s.content);
  const deals = useApp((s) => s.deals);
  const capacity = useApp((s) => s.profile.weeklyCapacityHours);
  const toast = useUi((s) => s.toast);
  const [day, setDay] = useState(2);
  const [time, setTime] = useState("17:00");
  if (!draft) return null;

  const perDayCap = capacity / 6;
  const load = (offset: number) => {
    const iso = daysFromNow(offset);
    return content.filter((c) => c.date === iso && c.status !== "published").reduce((s, c) => s + c.effort, 0);
  };
  const w = computeWorkload(content, deals, capacity);
  const suggested = [...Array(14).keys()].slice(1).sort((a, b) => load(a) - load(b))[0];

  return (
    <Modal
      open
      onClose={onClose}
      title="Add to calendar"
      footer={
        <div className="flex justify-end">
          <Button
            variant="dark"
            onClick={() => {
              addContent({ ...draft, status: "idea", date: daysFromNow(day), time, aiGenerated: true });
              toast(`Added to ${fmtDate(daysFromNow(day), { weekday: "long", month: "short", day: "numeric" })}`, { label: "Open calendar", href: "/studio/calendar" });
              onClose();
            }}
          >
            Add to {fmtDate(daysFromNow(day), { month: "short", day: "numeric" })}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
          <PlatformGlyph platform={draft.platform} size={20} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{draft.title}</div>
            <div className="text-sm text-ink-2">
              {PLATFORMS[draft.platform].label} · {draft.format} · ~{draft.effort}h
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-semibold">Pick a day</h3>
            <span className="text-xs text-ink-2">Darker = busier · this week is {w.status}</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(14).keys()].map((i) => {
              const l = load(i);
              const ratio = l / perDayCap;
              return (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={cn(
                    "relative flex flex-col items-center rounded-xl border py-2 text-xs transition",
                    day === i ? "border-ink ring-1 ring-ink" : "border-line-soft hover:border-ink",
                  )}
                  style={{ background: ratio > 1 ? "#ffe6df" : ratio > 0.6 ? "#fff1dc" : ratio > 0 ? "#f7f7f7" : "#fff" }}
                >
                  <span className="text-ink-2">{fmtDate(daysFromNow(i), { weekday: "short" })}</span>
                  <span className="text-base font-semibold">{fmtDate(daysFromNow(i), { day: "numeric" })}</span>
                  <span className="text-[10px] text-ink-2">{l ? `${l}h` : "free"}</span>
                  {i === suggested && <span className="absolute -top-2 rounded-full bg-ink px-1.5 text-[9px] font-bold text-white">BEST</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Time</h3>
          <div className="flex gap-2">
            {["09:00", "12:30", "17:00", "19:00"].map((t) => (
              <button key={t} onClick={() => setTime(t)} className={cn("rounded-full border px-3 py-1.5 text-sm", time === t ? "border-ink bg-ink text-white" : "border-line")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
