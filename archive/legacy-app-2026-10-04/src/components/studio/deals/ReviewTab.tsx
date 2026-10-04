"use client";

import { useState } from "react";
import { Check, CircleCheck, MessageSquareText, Play, Upload } from "lucide-react";
import { DisclosureCheck } from "@/components/studio/DisclosureCheck";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { estimateRate } from "@/lib/logic/rate";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Deal, ReviewComment } from "@/lib/types";
import { cn, money, timeAgo } from "@/lib/utils";

const ts = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const SCOPE = {
  praise: { label: "Praise", cls: "bg-surface-2 text-ink-2" },
  in: { label: "In scope", cls: "bg-babu-soft text-babu" },
  out: { label: "Out of scope", cls: "bg-arches-soft text-arches" },
};

/** Frame.io-style draft review: timestamped notes, revision rounds and scope-creep detection. */
export function ReviewTab({ deal }: { deal: Deal }) {
  const profile = useApp((s) => s.profile);
  const resolve = useApp((s) => s.resolveComment);
  const submitRevision = useApp((s) => s.submitRevision);
  const approve = useApp((s) => s.approveDraft);
  const updateDeal = useApp((s) => s.updateDeal);
  const threads = useApp((s) => s.threads);
  const sendMessage = useApp((s) => s.sendMessage);
  const toast = useUi((s) => s.toast);
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState<{ subject: string; body: string } | null>(null);
  const [replySource, setReplySource] = useState<AiSource>();
  const [loading, setLoading] = useState(false);
  const r = deal.review;

  if (!r)
    return (
      <div className="rounded-2xl bg-surface p-6 text-sm text-ink-2">
        No draft yet. When you upload a cut, the brand leaves timestamped notes here and CreatorAI tracks revision rounds against your agreement.
      </div>
    );

  const notes = r.comments.filter((c) => c.scope !== "praise");
  const out = r.comments.filter((c) => c.scope === "out");
  const openIn = r.comments.filter((c) => c.scope === "in" && !c.resolved);
  const addOn = Math.round((estimateRate(profile, [{ platform: deal.platform, label: "integration", qty: 1 }], deal.category).target * 0.5) / 50) * 50;

  const draftReply = async () => {
    setLoading(true);
    setReply({ subject: "", body: "" });
    try {
      const res = await runAi("feedback", {
        creator: creatorBrief(profile),
        brand: deal.brand,
        contact: deal.contact.name,
        comments: r.comments.map((c) => ({ at: ts(c.at), text: c.text, scope: c.scope })),
        roundsUsed: r.roundsUsed,
        roundsIncluded: r.roundsIncluded,
        extraFee: addOn,
      });
      setReply(res.data);
      setReplySource(res.source);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Player */}
      <div className="overflow-hidden rounded-2xl bg-black">
        <div className="relative aspect-video">
          <Photo k={r.thumb} w={900} className="absolute inset-0 opacity-80" />
          <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            v{r.version} · submitted {timeAgo(r.submittedAt)} ago
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow">
              <Play className="ml-1 size-6 fill-ink" />
            </span>
          </span>
        </div>
        <div className="relative px-4 py-4">
          <div className="relative h-1.5 rounded-full bg-white/25">
            <div className="h-full w-1/3 rounded-full bg-white/70" />
            {r.comments.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                title={`${ts(c.at)} · ${c.text}`}
                className={cn("absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black transition hover:scale-125", c.scope === "out" ? "bg-[#ff6b4a]" : c.scope === "in" ? "bg-[#4ade80]" : "bg-white", active === c.id && "scale-150")}
                style={{ left: `${(c.at / r.durationSec) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/60">
            <span>0:00</span>
            <span>{ts(r.durationSec)}</span>
          </div>
        </div>
      </div>

      {/* Rounds + status */}
      <div className="flex items-center justify-between rounded-2xl border border-line-soft p-4">
        <div>
          <div className="text-sm font-semibold">Revision rounds</div>
          <div className="text-xs text-ink-2">
            {r.roundsUsed} of {r.roundsIncluded} included rounds used
          </div>
        </div>
        <div className="flex gap-1.5">
          {[...Array(r.roundsIncluded)].map((_, i) => (
            <span key={i} className={cn("h-2 w-8 rounded-full", i < r.roundsUsed ? "bg-ink" : "bg-line-soft")} />
          ))}
        </div>
      </div>

      {r.status === "approved" ? (
        <div className="flex items-center gap-3 rounded-2xl bg-babu-soft p-4 text-sm text-babu">
          <CircleCheck className="size-5" /> <span><b>Approved by {deal.brand}.</b> You&apos;re clear to publish.</span>
        </div>
      ) : r.status === "awaiting" ? (
        <div className="rounded-2xl bg-surface p-4 text-sm">
          <b>v{r.version} sent — waiting on {deal.brand}.</b> We&apos;ll nudge them if there&apos;s no feedback in 2 business days.
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => { approve(deal.id); toast(`${deal.brand} approved v${r.version}! 🎉`); }}>
              Simulate brand approval
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* AI summary */}
          <div className="ai-border rounded-2xl p-5 text-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AiSpark className="size-4" /> {notes.length} notes · {notes.length - out.length} in scope · {out.length} outside your agreement
            </div>
            {out.length > 0 && (
              <p className="text-ink">
                “{out[0].text}” adds a <b>new deliverable</b> that isn&apos;t in your contract. Don&apos;t absorb it — offer it as an add-on for about <b>{money(addOn)}</b>, or as a separate Short.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="ai" onClick={draftReply}>
                <MessageSquareText className="size-4" /> Draft reply
              </Button>
              <Button
                size="sm"
                variant="dark"
                disabled={openIn.length > 0 || r.roundsUsed >= r.roundsIncluded}
                onClick={() => {
                  submitRevision(deal.id);
                  toast(`v${r.version + 1} uploaded — ${deal.brand} has been notified.`);
                }}
              >
                <Upload className="size-4" /> Upload v{r.version + 1}
              </Button>
            </div>
            {openIn.length > 0 && <p className="mt-2 text-xs text-ink-2">Resolve the {openIn.length} in-scope note{openIn.length > 1 ? "s" : ""} below to upload the next version.</p>}
            {r.roundsUsed >= r.roundsIncluded && <p className="mt-2 text-xs text-arches">All included rounds used — further revisions are billable (typically 10–20% of the fee per round).</p>}
          </div>

          {/* Comments */}
          <ul className="space-y-2">
            {r.comments.map((c) => (
              <CommentRow key={c.id} c={c} active={active === c.id} onToggle={() => resolve(deal.id, c.id)} onFocus={() => setActive(c.id)} />
            ))}
          </ul>
        </>
      )}

      <DisclosureCheck caption={deal.caption ?? ""} onChange={(v) => updateDeal(deal.id, { caption: v })} brand={deal.brand} />

      <Modal
        open={Boolean(reply)}
        onClose={() => setReply(null)}
        title={`Reply to ${deal.brand}`}
        footer={
          <div className="flex items-center justify-between">
            <SourceBadge source={replySource} />
            <Button
              variant="rausch"
              disabled={!reply?.body || loading}
              onClick={() => {
                if (!reply) return;
                const t = threads.find((x) => x.org === deal.brand);
                if (t) sendMessage(t.id, `${reply.subject}\n\n${reply.body}`);
                toast(`Reply sent to ${deal.contact.name}.`);
                setReply(null);
              }}
            >
              Send
            </Button>
          </div>
        }
      >
        <div className="p-6">
          {loading || !reply?.body ? (
            <AiThinking label="Writing a reply that protects your scope" />
          ) : (
            <div className="rounded-2xl border border-line">
              <input value={reply.subject} onChange={(e) => setReply({ ...reply, subject: e.target.value })} className="w-full border-b border-line-soft px-4 py-3 text-sm font-semibold outline-none" />
              <textarea value={reply.body} onChange={(e) => setReply({ ...reply, body: e.target.value })} rows={14} className="thin-scrollbar block w-full resize-none px-4 py-3 text-sm leading-relaxed outline-none" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function CommentRow({ c, active, onToggle, onFocus }: { c: ReviewComment; active: boolean; onToggle: () => void; onFocus: () => void }) {
  return (
    <li onClick={onFocus} className={cn("flex gap-3 rounded-xl border p-3.5 text-sm transition", active ? "border-ink" : "border-line-soft")}>
      {c.scope !== "praise" ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={c.resolved ? "Mark unresolved" : "Mark resolved"}
          className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border", c.resolved ? "border-ink bg-ink text-white" : "border-[#b0b0b0]")}
        >
          {c.resolved && <Check className="size-3.5" strokeWidth={3} />}
        </button>
      ) : (
        <span className="mt-0.5 size-5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] text-white">{ts(c.at)}</span>
          <span className="font-semibold">{c.author}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", SCOPE[c.scope].cls)}>{SCOPE[c.scope].label}</span>
        </div>
        <p className={cn("mt-1.5", c.resolved && "text-ink-2 line-through")}>{c.text}</p>
      </div>
    </li>
  );
}
