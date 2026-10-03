"use client";

import { useState } from "react";
import { FileWarning, ShieldCheck, Send } from "lucide-react";
import { AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { useApp, useUi } from "@/lib/store";
import type { ContractScan, Deal } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEV = {
  high: { label: "High risk", cls: "bg-arches-soft text-arches", dot: "bg-arches" },
  medium: { label: "Medium", cls: "bg-amber-soft text-amber", dot: "bg-amber" },
  low: { label: "Low", cls: "bg-surface-2 text-ink-2", dot: "bg-ink-3" },
};

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const color = score >= 75 ? "#008a05" : score >= 50 ? "#e07a00" : "#c13515";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ebebeb" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-bold">{score}</span>
        <span className="text-[9px] font-semibold text-ink-2">/ 100</span>
      </span>
    </div>
  );
}

export function ContractTab({ deal }: { deal: Deal }) {
  const updateDeal = useApp((s) => s.updateDeal);
  const moveDeal = useApp((s) => s.moveDeal);
  const sendMessage = useApp((s) => s.sendMessage);
  const threads = useApp((s) => s.threads);
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [text, setText] = useState(deal.contractText ?? "");
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState<{ subject: string; body: string } | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const scan = deal.contractScan;

  const runScan = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await runAi("contract", { text });
      const result: ContractScan = { ...res.data, source: res.source };
      updateDeal(deal.id, { contractText: text, contractScan: result });
    } catch {
      toast("Couldn't scan the contract — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const draftCounter = async () => {
    if (!scan) return;
    setCounterLoading(true);
    setCounter({ subject: "", body: "" });
    try {
      const res = await runAi("counter", {
        creator: creatorBrief(profile),
        brand: deal.brand,
        contact: deal.contact.name,
        campaign: deal.campaign,
        offer: deal.value,
        counter: deal.value,
        reasons: [],
        termChanges: scan.flags.filter((f) => f.severity !== "low").map((f) => f.suggestion),
      });
      setCounter(res.data);
    } finally {
      setCounterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!scan && (
        <>
          <div>
            <h3 className="mb-1 font-semibold">Contract</h3>
            <p className="mb-3 text-sm text-ink-2">Paste the agreement. CreatorAI flags clauses that cost you money or rights — with redlines you can send back in one click.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Paste contract text…"
              className="thin-scrollbar w-full resize-none rounded-xl border border-line p-4 font-mono text-xs leading-relaxed outline-none focus:border-ink"
            />
          </div>
          {loading ? (
            <div className="rounded-xl border border-line-soft p-5">
              <AiThinking label="Reading every clause" />
            </div>
          ) : (
            <Button variant="rausch" size="lg" className="w-full" disabled={!text.trim()} onClick={runScan}>
              <ShieldCheck className="size-5" /> Scan contract with AI
            </Button>
          )}
          <p className="text-xs text-ink-2">Not legal advice. For high-value deals, CreatorAI can connect you with a creator lawyer.</p>
        </>
      )}

      {scan && (
        <>
          <div className="flex items-center gap-5 rounded-2xl bg-surface p-5">
            <ScoreRing score={scan.score} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-semibold">Creator-friendliness</h3>
                <SourceBadge source={scan.source} />
              </div>
              <p className="text-sm">{scan.summary}</p>
            </div>
          </div>

          <div className="flex gap-2 text-xs font-semibold">
            {(["high", "medium", "low"] as const).map((s) => {
              const n = scan.flags.filter((f) => f.severity === s).length;
              return (
                <span key={s} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1", SEV[s].cls)}>
                  <span className={cn("size-1.5 rounded-full", SEV[s].dot)} /> {n} {SEV[s].label.toLowerCase()}
                </span>
              );
            })}
          </div>

          <ul className="space-y-3">
            {scan.flags.map((f, i) => (
              <li key={i} className="rounded-2xl border border-line-soft p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <FileWarning className={cn("size-4", f.severity === "high" ? "text-arches" : f.severity === "medium" ? "text-amber" : "text-ink-2")} />
                    {f.title}
                  </h4>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", SEV[f.severity].cls)}>{SEV[f.severity].label}</span>
                </div>
                {f.clause !== "—" && <blockquote className="mt-3 border-l-2 border-line pl-3 text-xs leading-relaxed text-ink-2 italic">“{f.clause}”</blockquote>}
                <p className="mt-3 text-sm">{f.issue}</p>
                <p className="mt-2 rounded-lg bg-babu-soft px-3 py-2 text-sm text-babu">
                  <b>Ask for:</b> {f.suggestion}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            {scan.flags.some((f) => f.severity !== "low") && (
              <Button variant="rausch" className="flex-1" onClick={draftCounter}>
                <Send className="size-4" /> Send redlines to {deal.contact.name.split(" ")[0]}
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => updateDeal(deal.id, { contractScan: undefined })}>
              Scan a new version
            </Button>
          </div>
        </>
      )}

      <Modal
        open={Boolean(counter)}
        onClose={() => setCounter(null)}
        title="Your counter-proposal"
        footer={
          <div className="flex justify-end">
            <Button
              variant="rausch"
              disabled={!counter?.body || counterLoading}
              onClick={() => {
                if (!counter) return;
                const t = threads.find((x) => x.org === deal.brand);
                if (t) sendMessage(t.id, `${counter.subject}\n\n${counter.body}`);
                if (deal.stage !== "negotiating") moveDeal(deal.id, "negotiating");
                updateDeal(deal.id, { notes: `Redlines sent ${new Date().toLocaleDateString()}. Waiting on revised contract.` });
                toast(`Redlines sent to ${deal.brand}. We'll scan the revised contract when it arrives.`);
                setCounter(null);
              }}
            >
              Send
            </Button>
          </div>
        }
      >
        <div className="p-6">
          {counterLoading || !counter?.body ? (
            <AiThinking label="Writing a firm, friendly counter" />
          ) : (
            <div className="rounded-2xl border border-line">
              <input value={counter.subject} onChange={(e) => setCounter({ ...counter, subject: e.target.value })} className="w-full border-b border-line-soft px-4 py-3 text-sm font-semibold outline-none" />
              <textarea value={counter.body} onChange={(e) => setCounter({ ...counter, body: e.target.value })} rows={14} className="thin-scrollbar block w-full resize-none px-4 py-3 text-sm leading-relaxed outline-none" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
