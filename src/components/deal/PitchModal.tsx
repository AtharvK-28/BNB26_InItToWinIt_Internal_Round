"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Overlay";
import { creatorBrief, runAi } from "@/lib/ai/client";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Campaign } from "@/lib/types";
import { cn, money } from "@/lib/utils";

type Tone = "warm" | "concise" | "bold";

export function PitchModal({ open, onClose, c, fairRate, counter }: { open: boolean; onClose: () => void; c: Campaign; fairRate: number; counter: number }) {
  const router = useRouter();
  const profile = useApp((s) => s.profile);
  const pitchCampaign = useApp((s) => s.pitchCampaign);
  const toast = useUi((s) => s.toast);
  const [amount, setAmount] = useState(Math.max(c.base, counter));
  const [tone, setTone] = useState<Tone>("warm");
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [note, setNote] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const options = [
    { v: c.base, label: "Accept offer", sub: money(c.base) },
    ...(counter > c.base ? [{ v: counter, label: "Counter", sub: `${money(counter)} · recommended` }] : []),
    ...(fairRate > counter ? [{ v: fairRate, label: "Full fair rate", sub: money(fairRate) }] : []),
  ];

  const generate = async () => {
    setLoading(true);
    try {
      const res = await runAi("pitch", {
        creator: creatorBrief(profile),
        brand: c.brand,
        manager: c.manager.name,
        campaign: c.title,
        description: c.description,
        deliverables: c.deliverables.map((d) => `${d.qty} × ${d.label} (${d.platform})`),
        fitReasons: c.fitReasons,
        amount,
        offer: c.base,
        tone,
      });
      setDraft(res.data);
      setSource(res.source);
      setNote(res.note);
    } catch {
      toast("Couldn't generate a pitch — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const send = () => {
    if (!draft) return;
    const id = pitchCampaign(c, { amount, pitch: `${draft.subject}\n\n${draft.body}` });
    setSent(true);
    toast(`Pitch sent to ${c.brand}. We'll nudge you if they don't reply in 3 days.`, { label: "Track deal", href: `/studio/deals?open=${id}` });
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setSent(false);
      setDraft(null);
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={sent ? "Pitch sent" : `Pitch ${c.brand}`}
      width={640}
      footer={
        sent ? (
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={close}>
              Keep exploring
            </Button>
            <Button variant="dark" onClick={() => router.push("/studio/deals")}>
              Open deal pipeline
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-2">
              Pitching <b className="text-ink">{money(amount)}</b> · Net-15 · 30-day organic usage
            </span>
            <Button variant="rausch" size="lg" disabled={!draft} onClick={send}>
              Send pitch
            </Button>
          </div>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-babu-soft">
            <Check className="size-8 text-babu" strokeWidth={3} />
          </span>
          <h3 className="text-[22px] font-semibold">Your pitch is on its way</h3>
          <p className="mt-2 max-w-sm text-ink-2">
            {c.manager.name} usually replies within a day. We added {c.brand} to your pipeline under <b>Pitched</b> and will remind you to follow up.
          </p>
        </div>
      ) : (
        <div className="space-y-7 px-6 py-6">
          <section>
            <h3 className="mb-3 text-lg font-semibold">Your rate</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {options.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setAmount(o.v)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    amount === o.v ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink",
                  )}
                >
                  <div className="text-sm font-semibold">{o.label}</div>
                  <div className="mt-0.5 text-sm text-ink-2">{o.sub}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <span className="text-sm text-ink-2">Custom</span>
              <span className="text-lg font-semibold">$</span>
              <input
                type="number"
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full bg-transparent text-lg font-semibold outline-none"
              />
            </div>
            {amount > c.base && (
              <p className="mt-2 flex items-start gap-2 text-sm text-ink-2">
                <AiSpark className="mt-0.5 size-4 shrink-0" />
                You&apos;re asking {Math.round((amount / c.base - 1) * 100)}% above their offer. Brands expect a counter — your pitch will back the number with your real stats.
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tone</h3>
              <Segmented<Tone>
                size="sm"
                value={tone}
                onChange={setTone}
                options={[
                  { id: "warm", label: "Warm" },
                  { id: "concise", label: "Concise" },
                  { id: "bold", label: "Bold" },
                ]}
              />
            </div>
            {!draft && !loading && (
              <button
                onClick={generate}
                className="ai-border flex w-full items-center gap-4 rounded-2xl p-5 text-left transition hover:shadow-card"
              >
                <span className="ai-bg flex size-11 shrink-0 items-center justify-center rounded-full">
                  <AiSpark className="size-5 [&_path]:fill-white" />
                </span>
                <span>
                  <span className="block font-semibold">Write my pitch</span>
                  <span className="block text-sm text-ink-2">Uses your stats, voice and why you fit {c.brand} — you can edit everything.</span>
                </span>
              </button>
            )}
            {loading && (
              <div className="space-y-3 rounded-2xl border border-line-soft p-5">
                <AiThinking label="Writing your pitch" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            )}
            {draft && !loading && (
              <div className="rounded-2xl border border-line">
                <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
                  <span className="text-sm text-ink-2">Subject</span>
                  <input
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={12}
                  className="thin-scrollbar block w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none"
                />
                <div className="flex items-center justify-between border-t border-line-soft px-4 py-2.5">
                  <SourceBadge source={source} />
                  <button onClick={generate} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
                    <RotateCcw className="size-3.5" /> Rewrite
                  </button>
                </div>
              </div>
            )}
            {note && <p className="mt-2 text-xs text-amber">{note}</p>}
          </section>
        </div>
      )}
    </Modal>
  );
}
