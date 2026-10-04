"use client";

import { useMemo, useState } from "react";
import { BellRing, CircleCheck, Landmark, PieChart, Table2, ChartColumn } from "lucide-react";
import { ChartFrame, ForecastLine, Legend, StackedColumns } from "@/components/charts/Charts";
import { ReminderModal } from "@/components/studio/ReminderModal";
import { TaxPlanner } from "@/components/studio/TaxPlanner";
import { Card, PageTitle, StudioPage } from "@/components/studio/Shell";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Pill, Segmented } from "@/components/ui/Controls";
import { BrandLogo } from "@/components/ui/Media";
import { STREAMS } from "@/lib/data/meta";
import { forecast, monthTotal } from "@/lib/logic/forecast";
import { useApp, useUi } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { cn, daysUntil, fmtDate, money } from "@/lib/utils";

const monthShort = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("en-US", { month: "short" });
const monthLong = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
const k = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`);

export default function EarningsPage() {
  return (
    <StudioPage>
      <Earnings />
    </StudioPage>
  );
}

function Earnings() {
  const earnings = useApp((s) => s.earnings);
  const deals = useApp((s) => s.deals);
  const markPaid = useApp((s) => s.markPaid);
  const toast = useUi((s) => s.toast);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [remind, setRemind] = useState<Deal | null>(null);

  const total = earnings.reduce((s, m) => s + monthTotal(m), 0);
  const streamTotals = STREAMS.map((st) => ({ ...st, value: earnings.reduce((s, m) => s + m[st.id], 0) }));
  const top = [...streamTotals].sort((a, b) => b.value - a.value)[0];
  const fc = useMemo(() => forecast(earnings, deals), [earnings, deals]);
  const next90 = fc.reduce((s, f) => s + f.value, 0);
  const invoices = deals.filter((d) => d.invoice).sort((a, b) => (a.invoice!.status === "paid" ? 1 : 0) - (b.invoice!.status === "paid" ? 1 : 0) || a.invoice!.due.localeCompare(b.invoice!.due));
  const owed = invoices.filter((d) => d.invoice!.status !== "paid");
  const taxRate = useApp((s) => s.taxRate);
  const held = deals.filter((d) => d.escrow?.status === "funded").reduce((s, d) => s + d.escrow!.amount, 0);
  const quarter = earnings.slice(-3).reduce((s, m) => s + monthTotal(m), 0);
  const last6 = earnings.slice(-7, -1).map(monthTotal);
  const avg6 = last6.reduce((a, b) => a + b, 0) / last6.length;
  const dip = [...fc].sort((a, b) => a.value - b.value)[0];
  const swing = Math.round(((Math.max(...last6) - Math.min(...last6)) / (last6.reduce((a, b) => a + b, 0) / last6.length)) * 100);

  return (
    <>
      <PageTitle title="Earnings" sub="Every income stream in one place — brand deals, ads, affiliates, memberships and products." />

      <section className="mb-10">
        <div className="text-ink-2">You&apos;ve made</div>
        <div className="text-[48px] leading-none font-semibold tracking-tight md:text-[56px]">{money(total)}</div>
        <div className="mt-2 text-ink-2">over the last 12 months</div>
      </section>

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Owed to you" value={money(owed.reduce((s, d) => s + d.value, 0))} sub={`${owed.length} open invoice${owed.length === 1 ? "" : "s"}`} />
        <Tile label="Expected next 90 days" value={money(next90)} sub="Forecast, see below" />
        <Tile label="Held in CreatorCover" value={money(held)} sub="prepaid, released on approval" />
        <Tile label="Set aside for taxes" value={money(quarter * taxRate)} sub={`${Math.round(taxRate * 100)}% of this quarter`} />
      </div>

      <Card className="mb-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Income by month</h2>
            <p className="text-sm text-ink-2">Stacked by stream · hover a month for the breakdown</p>
          </div>
          <Segmented
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { id: "chart", label: <span className="inline-flex items-center gap-1.5"><ChartColumn className="size-3.5" />Chart</span> },
              { id: "table", label: <span className="inline-flex items-center gap-1.5"><Table2 className="size-3.5" />Table</span> },
            ]}
          />
        </div>
        <Legend className="mb-4" items={streamTotals.map((s) => ({ color: s.color, label: s.label, value: money(s.value) }))} />
        {view === "chart" ? (
          <ChartFrame>
            <StackedColumns
              height={300}
              format={k}
              series={STREAMS}
              highlight={earnings.length - 1}
              data={earnings.map((m) => ({ label: monthShort(m.month), sub: monthLong(m.month), values: { deals: m.deals, ads: m.ads, affiliate: m.affiliate, members: m.members, products: m.products } }))}
            />
          </ChartFrame>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line-soft text-left text-xs text-ink-2">
                  <th className="py-2 font-medium">Month</th>
                  {STREAMS.map((s) => (
                    <th key={s.id} className="py-2 text-right font-medium">
                      {s.label}
                    </th>
                  ))}
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft tabular-nums">
                {earnings.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2">{monthLong(m.month)}</td>
                    {STREAMS.map((s) => (
                      <td key={s.id} className="py-2 text-right">
                        {money(m[s.id])}
                      </td>
                    ))}
                    <td className="py-2 text-right font-semibold">{money(monthTotal(m))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-1 flex items-center gap-2">
            <AiSpark className="size-4" />
            <h2 className="text-lg font-semibold">Cash-flow forecast</h2>
          </div>
          <p className="mb-5 text-sm text-ink-2">Recurring streams use your 6-month average. Brand deals use expected payment dates, weighted by how likely each one is to close.</p>
          <ChartFrame>
            <ForecastLine
              format={k}
              history={earnings.slice(-7, -1).map((m) => ({ label: monthShort(m.month), value: monthTotal(m) }))}
              forecast={fc.map((f) => ({ label: f.label, value: f.value, low: f.low, high: f.high }))}
            />
          </ChartFrame>
          {dip.value < avg6 * 0.85 && (
            <p className="mt-4 flex gap-2 rounded-xl bg-amber-soft p-3 text-sm text-ink">
              <AiSpark className="mt-0.5 size-4 shrink-0" />
              <span>
                <b>{dip.month.toLocaleDateString("en-US", { month: "long" })} looks light</b> — about {money(avg6 - dip.value)} below your 6-month average. Brand deals take weeks to pay out, so the time to pitch is now.
              </span>
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {fc.map((f) => (
              <div key={f.label} className="rounded-xl bg-surface p-3">
                <div className="text-ink-2">{f.month.toLocaleDateString("en-US", { month: "long" })}</div>
                <div className="font-semibold">{money(f.value)}</div>
                <div className="text-xs text-ink-2">
                  {money(f.low)}–{money(f.high)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-1 flex items-center gap-2">
            <PieChart className="size-4" />
            <h2 className="text-lg font-semibold">Income mix</h2>
          </div>
          <p className="mb-5 text-sm text-ink-2">How dependent you are on any single stream.</p>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {streamTotals.map((s) => (
              <div key={s.id} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${Math.round((s.value / total) * 100)}%`} />
            ))}
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            {streamTotals.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
                <span className="flex-1">{s.label}</span>
                <span className="text-ink-2 tabular-nums">{money(s.value)}</span>
                <span className="w-10 text-right font-semibold tabular-nums">{Math.round((s.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3 rounded-xl bg-surface p-4 text-sm">
            <AiSpark className="mt-0.5 size-4 shrink-0" />
            <span>
              Your monthly income swung <b>{swing}%</b> between your best and worst month this half-year. Brand deals drive most of that. Memberships grew every month — a 10% price increase there adds stable income without new work.
            </span>
          </div>
        </Card>
      </div>

      <section className="mb-8">
        <TaxPlanner />
      </section>

      <Card className="p-0!">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-lg font-semibold">Invoices</h2>
            <p className="text-sm text-ink-2">Reminders go out automatically — friendly, then firm.</p>
          </div>
          <Landmark className="size-5 text-ink-2" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-y border-line-soft bg-surface text-left text-xs text-ink-2">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium">Brand</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Due</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {invoices.map((d) => {
                const inv = d.invoice!;
                const overdue = inv.status !== "paid" && daysUntil(inv.due) < 0;
                return (
                  <tr key={d.id}>
                    <td className="px-6 py-4 font-semibold">{inv.number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BrandLogo initials={d.brandInitials} color={d.brandColor} size={28} className="rounded-md!" />
                        {d.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums">{money(d.value)}</td>
                    <td className="px-6 py-4">{fmtDate(inv.due)}</td>
                    <td className="px-6 py-4">
                      {inv.status === "paid" ? (
                        <Pill tone="good">
                          <CircleCheck className="size-3" /> Paid
                        </Pill>
                      ) : overdue ? (
                        <Pill tone="bad">{-daysUntil(inv.due)}d overdue</Pill>
                      ) : (
                        <Pill tone="info">Due in {daysUntil(inv.due)}d</Pill>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inv.status !== "paid" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant={overdue ? "rausch" : "ghost"} onClick={() => setRemind(d)}>
                            <BellRing className="size-3.5" /> Remind
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              markPaid(d.id);
                              toast(`${money(d.value)} from ${d.brand} marked as paid. 🎉`);
                            }}
                          >
                            Mark paid
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <ReminderModal deal={remind} onClose={() => setRemind(null)} />
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line-soft p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className={cn("text-xs text-ink-2")}>{sub}</div>
    </div>
  );
}
