"use client";

import { useState } from "react";
import { CircleCheck, Share, Sparkles, TrendingUp } from "lucide-react";
import { AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { creatorBrief, runAi } from "@/lib/ai/client";
import type { ReportOut } from "@/lib/ai/schemas";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Deal } from "@/lib/types";
import { cn, compact, money } from "@/lib/utils";

/** Auto-generated sponsor report — the ROI proof brands increasingly ask for. */
export function ReportTab({ deal }: { deal: Deal }) {
  const profile = useApp((s) => s.profile);
  const claimBonus = useApp((s) => s.claimBonus);
  const toast = useUi((s) => s.toast);
  const [report, setReport] = useState<ReportOut | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(false);
  const m = deal.report;
  if (!m)
    return <div className="rounded-2xl bg-surface p-6 text-sm text-ink-2">Once the content is live for 7 days, CreatorAI pulls views, retention, clicks and comment sentiment into a report you can share with the brand.</div>;

  const bt = m.bonusTarget;
  const hit = bt ? (bt.metric === "ctr" ? m.ctr >= bt.threshold : m.views >= bt.threshold) : false;

  const generate = async () => {
    setLoading(true);
    try {
      const res = await runAi("report", {
        creator: creatorBrief(profile),
        brand: deal.brand,
        campaign: deal.campaign,
        metrics: { views: m.views, avgViewDuration: m.avgViewDuration, integrationRetention: m.integrationRetention, clicks: m.clicks, ctr: m.ctr, conversions: m.conversions, sentiment: m.sentiment },
        bonus: bt ? `${bt.label}: ${hit ? "achieved" : "not reached"} (${(m.ctr * 100).toFixed(2)}% vs ${(bt.threshold * 100).toFixed(1)}%)` : undefined,
      });
      setReport(res.data);
      setSource(res.source);
    } finally {
      setLoading(false);
    }
  };

  const tiles = [
    { label: "Views", value: compact(m.views) },
    { label: "Avg. view duration", value: m.avgViewDuration },
    { label: "Stayed through sponsor", value: `${Math.round(m.integrationRetention * 100)}%` },
    { label: "Link clicks", value: m.clicks.toLocaleString("en-US") },
    { label: "Click-through rate", value: `${(m.ctr * 100).toFixed(2)}%` },
    { label: "Conversions", value: `${m.conversions}` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-line-soft p-3">
            <div className="text-xs text-ink-2">{t.label}</div>
            <div className="text-lg font-semibold">{t.value}</div>
          </div>
        ))}
      </div>

      {bt && (
        <div className={cn("rounded-2xl p-5 text-sm", hit ? "bg-babu-soft" : "bg-surface")}>
          <div className="flex items-center gap-2 font-semibold">
            {hit ? <CircleCheck className="size-4 text-babu" /> : <TrendingUp className="size-4" />}
            Performance bonus {hit ? "unlocked" : "not reached yet"}
          </div>
          <p className="mt-1">
            {bt.label}: you hit <b>{(m.ctr * 100).toFixed(2)}%</b> against a {(bt.threshold * 100).toFixed(1)}% target — worth <b>{money(bt.amount)}</b>.
          </p>
          {hit && (
            <div className="mt-3">
              {bt.claimed ? (
                <span className="text-sm font-semibold text-babu">Added to your invoice ✓</span>
              ) : (
                <Button
                  size="sm"
                  variant="dark"
                  onClick={() => {
                    claimBonus(deal.id);
                    toast(`${money(bt.amount)} bonus added to ${deal.invoice?.number ?? "the invoice"}.`);
                  }}
                >
                  Add {money(bt.amount)} bonus to invoice
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 text-sm font-semibold">Top comments mentioning {deal.brand}</div>
        <ul className="space-y-2 text-sm">
          {m.topComments.map((c) => (
            <li key={c} className="rounded-xl bg-surface px-4 py-2.5">
              “{c}”
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-2">{Math.round(m.sentiment * 100)}% of comments mentioning the brand were positive.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line-soft p-5">
          <AiThinking label="Writing the brand report" />
        </div>
      ) : report ? (
        <div className="ai-border rounded-2xl p-5 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Report for {deal.brand}</span>
            <SourceBadge source={source} />
          </div>
          <p className="leading-relaxed">{report.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {report.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl bg-surface p-3">
            <b>Next pitch:</b> {report.nextPitch}
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="dark" onClick={() => toast(`Report shared with ${deal.contact.name}.`)}>
              <Share className="size-4" /> Share with brand
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast("Added to your media kit's recent partnerships.")}>
              Add to media kit
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ai" className="w-full" onClick={generate}>
          <Sparkles className="size-4" /> Write the sponsor report
        </Button>
      )}
    </div>
  );
}
