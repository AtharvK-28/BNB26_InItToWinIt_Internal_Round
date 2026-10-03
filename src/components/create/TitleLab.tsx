"use client";

import { useState } from "react";
import { Check, FlaskConical, Trophy, Wand2 } from "lucide-react";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Avatar, Photo } from "@/components/ui/Media";
import { creatorBrief, runAi } from "@/lib/ai/client";
import type { TitlesOut } from "@/lib/ai/schemas";
import type { ImageKey } from "@/lib/images";
import { useApp, useUi } from "@/lib/store";
import type { AbTest, AiSource } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

const THUMBS: ImageKey[] = ["deskWindow", "laptopGlow", "macbookWood", "laptopDesk", "keyboard", "uiDesign"];

/** Packaging lab — title + thumbnail variants, tested the way YouTube's Test & Compare does (up to 3, judged on watch time). */
export function TitleLab() {
  const profile = useApp((s) => s.profile);
  const abTests = useApp((s) => s.abTests);
  const startAbTest = useApp((s) => s.startAbTest);
  const toast = useUi((s) => s.toast);
  const [topic, setTopic] = useState("Why I quit ultrawide monitors");
  const [variants, setVariants] = useState<TitlesOut["variants"] | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);

  const run = async () => {
    setLoading(true);
    setPicked([]);
    try {
      const res = await runAi("titles", { creator: creatorBrief(profile), topic });
      setVariants(res.data.variants);
      setSource(res.source);
      setPicked([0, 1, 2].filter((i) => i < res.data.variants.length));
    } catch {
      toast("Couldn't generate titles — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-2 shadow-search md:h-[66px] md:flex-row md:items-center md:rounded-full"
        >
          <label className="flex min-w-0 flex-1 flex-col justify-center px-6">
            <span className="text-xs font-semibold">Video</span>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Working title or topic" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <button type="submit" disabled={loading || !topic.trim()} className="btn-rausch flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-60">
            <Wand2 className="size-4" /> Package it
          </button>
        </form>
        <p className="mt-3 text-sm text-ink-2">YouTube&apos;s Test &amp; Compare tries up to 3 title/thumbnail combos and picks the winner by watch time — not clicks — so avoid promises the video can&apos;t keep.</p>

        <div className="mt-8">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton aspect-video rounded-xl" />
                  {i === 0 && <AiThinking label="Testing angles" />}
                  <div className="skeleton h-4 w-4/5 rounded" />
                </div>
              ))}
            </div>
          )}
          {!loading && variants && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold">Pick up to 3 to test</h2>
                <div className="flex items-center gap-3">
                  <SourceBadge source={source} />
                  <Button
                    variant="dark"
                    disabled={picked.length < 2}
                    onClick={() => {
                      const test: Omit<AbTest, "id"> = {
                        video: topic,
                        status: "running",
                        daysLeft: 14,
                        impressions: 0,
                        variants: picked.map((i, k) => ({ title: variants[i].title, thumb: THUMBS[i % THUMBS.length], thumbText: variants[i].thumbnailText, share: 1 / picked.length + (k === 0 ? 0.0001 : 0) })),
                      };
                      startAbTest(test);
                      toast(`Test set up with ${picked.length} variants. Results build as impressions come in (up to 2 weeks).`);
                    }}
                  >
                    <FlaskConical className="size-4" /> Start test ({picked.length})
                  </Button>
                </div>
              </div>
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {variants.map((v, i) => {
                  const on = picked.includes(i);
                  return (
                    <button
                      key={v.title}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== i) : p.length < 3 ? [...p, i] : p))}
                      className={cn("group rounded-2xl p-2 text-left transition", on ? "bg-surface ring-2 ring-ink" : "hover:bg-surface")}
                    >
                      <Thumb k={THUMBS[i % THUMBS.length]} text={v.thumbnailText} />
                      <div className="mt-3 flex gap-3">
                        <Avatar k={profile.avatar} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-[15px] leading-5 font-semibold">{v.title}</div>
                          <div className="mt-0.5 text-sm text-ink-2">{profile.name} · predicted {v.score}</div>
                        </div>
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border", on ? "border-ink bg-ink text-white" : "border-[#b0b0b0]")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                      </div>
                      <p className="mt-2 flex gap-1.5 pl-11 text-xs text-ink-2">
                        <AiSpark className="mt-px size-3 shrink-0" />
                        <span>
                          <b className="text-ink">{v.angle}.</b> {v.why}
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-[22px] font-semibold">Your tests</h2>
        <p className="mb-5 text-sm text-ink-2">Share of watch time per variant, as reported by YouTube Test &amp; Compare.</p>
        <div className="space-y-4">
          {abTests.map((t) => {
            const lead = [...t.variants].sort((a, b) => b.share - a.share)[0];
            return (
              <div key={t.id} className="rounded-2xl border border-line-soft p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{t.video}</div>
                    <div className="text-sm text-ink-2">
                      {t.status === "running" ? `Running · ${t.daysLeft} days left` : "Finished"} · {t.impressions ? `${compact(t.impressions)} impressions` : "Collecting impressions"}
                    </div>
                  </div>
                  {t.impressions > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-babu-soft px-3 py-1 text-xs font-semibold text-babu">
                      <Trophy className="size-3.5" /> Leading: “{lead.thumbText}”
                    </span>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {t.variants.map((v) => (
                    <div key={v.title}>
                      <Thumb k={v.thumb} text={v.thumbText} small />
                      <div className="mt-2 line-clamp-1 text-sm font-semibold">{v.title}</div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                          <span className={cn("block h-full rounded-full", v === lead && t.impressions ? "bg-ink" : "bg-ink-3")} style={{ width: t.impressions ? `${v.share * 100}%` : "0%" }} />
                        </span>
                        <span className="w-10 text-right font-semibold tabular-nums">{t.impressions ? `${Math.round(v.share * 100)}%` : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Thumb({ k, text, small }: { k: ImageKey; text: string; small?: boolean }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl">
      <Photo k={k} w={560} h={315} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
      <span className={cn("absolute bottom-3 left-3 max-w-[70%] leading-none font-extrabold text-white uppercase drop-shadow", small ? "text-base" : "text-2xl")}>{text}</span>
    </div>
  );
}
