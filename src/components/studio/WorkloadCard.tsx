"use client";

import { useMemo } from "react";
import { Flame, Leaf, Moon } from "lucide-react";
import { ChartFrame, Columns, Meter } from "@/components/charts/Charts";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { computeWorkload, dayLabel } from "@/lib/logic/wellbeing";
import { useApp, useUi } from "@/lib/store";
import { daysFromNow, daysUntil, fmtDate } from "@/lib/utils";
import { Card } from "./Shell";

const STATUS = {
  light: { label: "Light week", tone: "text-babu", Icon: Leaf },
  balanced: { label: "Balanced", tone: "text-babu", Icon: Leaf },
  heavy: { label: "Heavy week", tone: "text-amber", Icon: Flame },
  overloaded: { label: "Overloaded", tone: "text-arches", Icon: Flame },
};

/** Burnout-aware workload: planned hours vs. capacity, with an AI rebalance. */
export function WorkloadCard() {
  const content = useApp((s) => s.content);
  const deals = useApp((s) => s.deals);
  const capacity = useApp((s) => s.profile.weeklyCapacityHours);
  const updateContent = useApp((s) => s.updateContent);
  const toast = useUi((s) => s.toast);
  const w = useMemo(() => computeWorkload(content, deals, capacity), [content, deals, capacity]);
  const st = STATUS[w.status];
  const perDayCap = capacity / 6;

  // Candidate to move: the biggest non-deal item on the busiest day.
  const movable = useMemo(() => {
    if (!w.busiestDay || w.busiestDay.hours <= perDayCap) return null;
    return content
      .filter((c) => c.date === w.busiestDay!.date && !c.dealId && c.status !== "published" && c.status !== "scheduled")
      .sort((a, b) => b.effort - a.effort)[0];
  }, [content, w, perDayCap]);

  const rebalance = () => {
    if (!movable) return;
    const lightest = [...w.perDay].filter((d) => daysUntil(d.date) > daysUntil(movable.date)).sort((a, b) => a.hours - b.hours)[0];
    const target = lightest?.date ?? daysFromNow(7);
    updateContent(movable.id, { date: target });
    toast(`Moved “${movable.title}” to ${fmtDate(target, { weekday: "long" })}.`);
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Your week</h3>
          <p className="text-sm text-ink-2">Planned work vs. your {capacity}h capacity</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${st.tone}`}>
          <st.Icon className="size-4" /> {st.label}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[28px] font-semibold">{w.hours.toFixed(0)}h</span>
        <span className="text-sm text-ink-2">of {capacity}h · {Math.round(w.ratio * 100)}%</span>
      </div>
      <Meter ratio={w.ratio} className="mt-2" />
      <ChartFrame className="mt-5">
        <Columns
          height={150}
          data={w.perDay.map((d, i) => ({ label: i === 0 ? "Today" : dayLabel(d.date), sub: fmtDate(d.date, { weekday: "long", month: "short", day: "numeric" }), value: Number(d.hours.toFixed(1)) }))}
          reference={{ value: Number(perDayCap.toFixed(1)), label: `${perDayCap.toFixed(1)}h/day` }}
          format={(n) => `${n}h`}
        />
      </ChartFrame>
      <div className="mt-4 flex gap-3 rounded-xl bg-surface p-4 text-sm">
        <AiSpark className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          {movable ? (
            <>
              <b>{fmtDate(w.busiestDay!.date, { weekday: "long" })}</b> is packed ({w.busiestDay!.hours.toFixed(1)}h). “{movable.title}” isn&apos;t tied to a deal — move it to your lightest day?
              <div className="mt-3">
                <Button size="sm" variant="dark" onClick={rebalance}>
                  Rebalance my week
                </Button>
              </div>
            </>
          ) : w.restDaysThisWeek >= 1 ? (
            <span className="flex items-start gap-2">
              You have <b>{w.restDaysThisWeek} light day{w.restDaysThisWeek > 1 ? "s" : ""}</b> this week. Protect at least one — a real day off is the simplest guard against burnout.
              <Moon className="mt-0.5 size-4 shrink-0 text-ink-2" />
            </span>
          ) : (
            <>No full rest day this week. Consider pushing one non-deal post to next week.</>
          )}
        </div>
      </div>
    </Card>
  );
}
