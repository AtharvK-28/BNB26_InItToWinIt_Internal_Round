"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check, Clock, Copy, FileText, FlaskConical, Lightbulb, Radar, Repeat2, Scissors, Wand2 } from "lucide-react";
import { ClipFinder } from "@/components/create/ClipFinder";
import { TitleLab } from "@/components/create/TitleLab";
import { Trends } from "@/components/create/Trends";
import { ScheduleModal, type ScheduleDraft } from "@/components/studio/ScheduleModal";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { AiSpark, AiThinking, SourceBadge } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Media";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { creatorBrief, runAi } from "@/lib/ai/client";
import type { IdeasOut, RepurposeOut, ScriptOut } from "@/lib/ai/schemas";
import { PLATFORMS } from "@/lib/data/meta";
import type { ImageKey } from "@/lib/images";
import { useApp, useUi } from "@/lib/store";
import type { AiSource, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "ideas" | "trends" | "script" | "titles" | "repurpose" | "clips";

const SAMPLE_TRANSCRIPT = `I deleted 80% of my desk. Here's what happened after 30 days.

For years my setup was all about more — more monitors, more lights, more gadgets. But I noticed I was spending the first 20 minutes of every day just untangling things and finding stuff.

So I removed everything that I hadn't touched in a week. The second monitor went first, and honestly that was the biggest change: I stopped context switching between six windows and started finishing one thing at a time.

The cable situation was the next problem. A $40 under-desk tray and some velcro ties fixed what three "premium" cable kits never did.

The surprising part? My focus time went from about 2 hours a day to almost 4, according to my screen-time stats. And the desk costs less than half of what it did.

I'd skip the fancy desk mat and the light bar if I started over. What I'd buy first is a good monitor arm — it changed my posture more than any chair.`;

const IDEA_CHIPS = ["Desk setups under $500", "Behind the scenes of a sponsored video", "Creator money myths", "Apps I actually use every day"];

export default function CreatePage() {
  const [mode, setMode] = useState<Mode>("ideas");
  const [scriptSeed, setScriptSeed] = useState<{ idea: string; platform: Platform } | null>(null);
  const [ideaSeed, setIdeaSeed] = useState<string | null>(null);
  const toScript = (idea: string, platform: Platform) => {
    setScriptSeed({ idea, platform });
    setMode("script");
  };
  const profile = useApp((s) => s.profile);
  return (
    <StudioPage>
      <PageTitle
        title={
          <>
            What are we <span className="ai-text">making</span> today?
          </>
        }
        sub={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            Writing in your voice:
            {profile.voice.slice(0, 3).map((v) => (
              <span key={v} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink">
                {v}
              </span>
            ))}
          </span>
        }
      />
      <div className="no-scrollbar -mx-4 mb-8 overflow-x-auto px-4">
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { id: "ideas", label: <span className="inline-flex items-center gap-1.5"><Lightbulb className="size-4" />Ideas</span> },
            { id: "trends", label: <span className="inline-flex items-center gap-1.5"><Radar className="size-4" />Trends</span> },
            { id: "script", label: <span className="inline-flex items-center gap-1.5"><FileText className="size-4" />Script</span> },
            { id: "titles", label: <span className="inline-flex items-center gap-1.5"><FlaskConical className="size-4" />Titles & thumbnails</span> },
            { id: "repurpose", label: <span className="inline-flex items-center gap-1.5"><Repeat2 className="size-4" />Repurpose</span> },
            { id: "clips", label: <span className="inline-flex items-center gap-1.5"><Scissors className="size-4" />Clips</span> },
          ]}
        />
      </div>
      {mode === "ideas" && <Ideas key={ideaSeed ?? "ideas"} initialPrompt={ideaSeed ?? undefined} onScript={toScript} />}
      {mode === "trends" && (
        <Trends
          onScript={toScript}
          onIdeas={(p) => {
            setIdeaSeed(p);
            setMode("ideas");
          }}
        />
      )}
      {mode === "script" && <Script key={scriptSeed?.idea} seed={scriptSeed} />}
      {mode === "titles" && <TitleLab />}
      {mode === "repurpose" && <Repurpose />}
      {mode === "clips" && <ClipFinder sample={SAMPLE_TRANSCRIPT} />}
    </StudioPage>
  );
}

/* ---------------------------------- Ideas ---------------------------------- */

function PromptPill({
  value,
  onChange,
  onSubmit,
  placeholder,
  platform,
  setPlatform,
  loading,
  cta,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  platform: Platform | "any";
  setPlatform: (p: Platform | "any") => void;
  loading: boolean;
  cta: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-2 shadow-search md:h-[66px] md:flex-row md:items-center md:rounded-full"
    >
      <label className="flex min-w-0 flex-1 flex-col justify-center px-6">
        <span className="text-xs font-semibold">Topic</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-ink-2" />
      </label>
      <span className="hidden h-8 w-px bg-line md:block" />
      <label className="flex flex-col justify-center px-6">
        <span className="text-xs font-semibold">Platform</span>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "any")} className="-ml-1 bg-transparent text-sm outline-none">
          <option value="any">Any platform</option>
          {(["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter"] as Platform[]).map((p) => (
            <option key={p} value={p}>
              {PLATFORMS[p].label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={loading} className="btn-rausch flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-60">
        <Wand2 className="size-4" />
        {cta}
      </button>
    </form>
  );
}

function Ideas({ onScript, initialPrompt }: { onScript: (idea: string, platform: Platform) => void; initialPrompt?: string }) {
  const profile = useApp((s) => s.profile);
  const content = useApp((s) => s.content);
  const toast = useUi((s) => s.toast);
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [platform, setPlatform] = useState<Platform | "any">("any");
  const [loading, setLoading] = useState(Boolean(initialPrompt));
  const [ideas, setIdeas] = useState<IdeasOut["ideas"] | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);

  const run = async (p = prompt) => {
    setLoading(true);
    try {
      const res = await runAi("ideas", { creator: creatorBrief(profile), prompt: p, platform, recent: content.slice(-8).map((c) => c.title) });
      setIdeas(res.data.ideas);
      setSource(res.source);
    } catch {
      toast("Couldn't generate ideas — please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Seeded from Trends: generate once on arrival.
  useEffect(() => {
    if (!initialPrompt) return;
    let alive = true;
    runAi("ideas", { creator: creatorBrief(profile), prompt: initialPrompt, platform: "any", recent: content.slice(-8).map((c) => c.title) })
      .then((res) => {
        if (!alive) return;
        setIdeas(res.data.ideas);
        setSource(res.source);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PromptPill value={prompt} onChange={setPrompt} onSubmit={() => run()} placeholder="Leave blank for ideas based on what's working now" platform={platform} setPlatform={setPlatform} loading={loading} cta="Get ideas" />
      <div className="mt-4 flex flex-wrap gap-2">
        {IDEA_CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setPrompt(c);
              run(c);
            }}
            className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-line-soft p-6">
                {i === 0 && <AiThinking label="Studying what your audience loves" />}
                <div className="skeleton h-5 w-4/5 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && ideas && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold">{ideas.length} ideas for you</h2>
              <SourceBadge source={source} />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea, i) => (
                <article key={i} className="flex animate-slide-up flex-col rounded-2xl border border-line-soft p-6 transition hover:shadow-card" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
                      <PlatformGlyph platform={idea.platform} size={16} className="text-ink" />
                      {PLATFORMS[idea.platform]?.label} · {idea.format}
                    </span>
                    <ScorePill score={idea.score} />
                  </div>
                  <h3 className="mt-4 text-lg leading-snug font-semibold">{idea.title}</h3>
                  <p className="mt-2 text-[15px] text-ink italic">“{idea.hook}”</p>
                  <p className="mt-3 flex flex-1 gap-2 text-sm text-ink-2">
                    <AiSpark className="mt-0.5 size-4 shrink-0" />
                    {idea.why}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                      <Clock className="size-3.5" /> ~{idea.effort}h
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSchedule({ title: idea.title, platform: idea.platform, format: idea.format, effort: idea.effort })}>
                        <CalendarPlus className="size-4" /> Plan
                      </Button>
                      <Button size="sm" variant="dark" onClick={() => onScript(idea.title, idea.platform)}>
                        Write script
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {!loading && !ideas && <EmptyState Icon={Lightbulb} title="Never stare at a blank page again" text="Ideas are ranked using your past performance, your audience and what's trending in your niche — and they avoid repeating your recent posts." />}
      </div>
      <ScheduleModal draft={schedule} onClose={() => setSchedule(null)} />
    </>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 85 ? "bg-babu-soft text-babu" : score >= 70 ? "bg-surface-2 text-ink" : "bg-amber-soft text-amber";
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tone)}>{score} · predicted</span>;
}

/* ---------------------------------- Script --------------------------------- */

const THUMBS: ImageKey[] = ["deskWindow", "laptopGlow", "macbookWood"];

function Script({ seed }: { seed: { idea: string; platform: Platform } | null }) {
  const profile = useApp((s) => s.profile);
  const deals = useApp((s) => s.deals);
  const toast = useUi((s) => s.toast);
  const active = deals.filter((d) => ["contracted", "production", "negotiating"].includes(d.stage));
  const [idea, setIdea] = useState(seed?.idea ?? "Why I quit ultrawide monitors");
  const [platform, setPlatform] = useState<Platform | "any">(seed?.platform ?? "youtube");
  const [sponsor, setSponsor] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<ScriptOut | null>(null);
  const [source, setSource] = useState<AiSource>();
  const [copied, setCopied] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await runAi("script", { creator: creatorBrief(profile), idea, platform: platform === "any" ? "youtube" : platform, sponsor: sponsor || undefined });
      setScript(res.data);
      setSource(res.source);
    } catch {
      toast("Couldn't write the script — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const asText = (s: ScriptOut) =>
    [`# ${s.title}`, `HOOK: ${s.hook}`, ...s.sections.map((x) => `\n## ${x.heading}\n${x.beats.map((b) => `- ${b}`).join("\n")}\nB-roll: ${x.broll}`), `\nCTA: ${s.cta}`].join("\n");

  return (
    <>
      <PromptPill value={idea} onChange={setIdea} onSubmit={run} placeholder="Your idea or working title" platform={platform} setPlatform={setPlatform} loading={loading} cta="Write script" />
      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-2">Integrate a sponsor:</span>
          {["", ...active.map((d) => d.brand)].map((b) => (
            <button key={b || "none"} onClick={() => setSponsor(b)} className={cn("rounded-full border px-3.5 py-1.5", sponsor === b ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
              {b || "None"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {loading && (
          <div className="space-y-4 rounded-2xl border border-line-soft p-8">
            <AiThinking label="Structuring your script" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-4 rounded" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        )}
        {!loading && script && (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <article className="rounded-2xl border border-line-soft p-6 md:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2 className="text-2xl leading-tight font-semibold">{script.title}</h2>
                <SourceBadge source={source} />
              </div>
              <div className="mb-8 rounded-2xl bg-rausch-soft p-5">
                <div className="text-xs font-bold tracking-wide text-rausch-dark uppercase">Hook · first 5 seconds</div>
                <p className="mt-1 text-lg font-semibold">“{script.hook}”</p>
              </div>
              <ol className="space-y-7">
                {script.sections.map((s, i) => (
                  <li key={i} className="relative border-l-2 border-line-soft pl-6">
                    <span className="absolute top-0 -left-[9px] size-4 rounded-full border-2 border-white bg-ink" />
                    <h3 className="font-semibold">{s.heading}</h3>
                    <ul className="mt-2 space-y-1.5 text-[15px]">
                      {s.beats.map((b, k) => (
                        <li key={k} className="flex gap-2">
                          <span className="text-ink-3">—</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                    {s.broll && <div className="mt-2 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-2">🎬 {s.broll}</div>}
                  </li>
                ))}
              </ol>
              <div className="mt-8 rounded-xl border border-line-soft p-4">
                <span className="text-xs font-bold tracking-wide text-ink-2 uppercase">Call to action</span>
                <p className="mt-1 font-medium">{script.cta}</p>
              </div>
            </article>
            <aside className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">Thumbnail concepts</h3>
                <div className="space-y-3">
                  {script.thumbnailIdeas.slice(0, 3).map((t, i) => (
                    <div key={t} className="relative aspect-video overflow-hidden rounded-xl">
                      <Photo k={THUMBS[i % THUMBS.length]} w={640} className="absolute inset-0" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                      <span className="absolute bottom-4 left-4 max-w-[70%] text-2xl leading-none font-extrabold text-white uppercase drop-shadow">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="dark"
                  onClick={() => {
                    navigator.clipboard?.writeText(asText(script)).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy script"}
                </Button>
                <Button variant="outline" onClick={() => setSchedule({ title: script.title, platform: platform === "any" ? "youtube" : platform, format: platform === "youtube" || platform === "any" ? "Long video" : "Short", effort: 6, notes: script.hook })}>
                  <CalendarPlus className="size-4" /> Add to calendar
                </Button>
              </div>
            </aside>
          </div>
        )}
        {!loading && !script && <EmptyState Icon={FileText} title="From idea to shoot-ready in seconds" text="A timestamped outline with a 5-second hook, B-roll notes, a natural sponsor slot and thumbnail concepts." />}
      </div>
      <ScheduleModal draft={schedule} onClose={() => setSchedule(null)} />
    </>
  );
}

/* --------------------------------- Repurpose ------------------------------- */

const REPURPOSE_TARGETS: Platform[] = ["tiktok", "youtube", "instagram", "x", "linkedin", "newsletter"];

function Repurpose() {
  const profile = useApp((s) => s.profile);
  const toast = useUi((s) => s.toast);
  const [source, setSource] = useState("");
  const [targets, setTargets] = useState<Platform[]>(["tiktok", "instagram", "x", "linkedin", "newsletter"]);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<RepurposeOut["outputs"] | null>(null);
  const [src, setSrc] = useState<AiSource>();
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const run = async () => {
    if (!source.trim()) {
      toast("Paste a transcript, script or description first.");
      return;
    }
    setLoading(true);
    try {
      const res = await runAi("repurpose", { creator: creatorBrief(profile), source, platforms: targets });
      setOut(res.data.outputs);
      setSrc(res.source);
    } catch {
      toast("Couldn't repurpose — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-line p-2 shadow-search">
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={6}
          placeholder="Paste a transcript, script, blog post or video description…"
          className="thin-scrollbar block w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-ink-2"
        />
        <div className="flex flex-col gap-3 border-t border-line-soft px-3 pt-3 pb-1 md:flex-row md:items-center">
          <button onClick={() => setSource(SAMPLE_TRANSCRIPT)} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line-soft">
            Use my latest video: “Minimal desk tour 2026”
          </button>
          <div className="flex flex-1 flex-wrap gap-1.5 md:justify-end">
            {REPURPOSE_TARGETS.map((p) => {
              const on = targets.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => setTargets((t) => (on ? t.filter((x) => x !== p) : [...t, p]))}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink")}
                >
                  <PlatformGlyph platform={p} size={13} />
                  {p === "youtube" ? "Shorts" : PLATFORMS[p].label}
                </button>
              );
            })}
          </div>
          <button onClick={run} disabled={loading || !targets.length} className="btn-rausch flex h-11 items-center justify-center gap-2 rounded-full px-6 font-semibold disabled:opacity-50">
            <Repeat2 className="size-4" /> Repurpose
          </button>
        </div>
      </div>

      <div className="mt-10">
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {targets.map((t, i) => (
              <div key={t} className="space-y-3 rounded-2xl border border-line-soft p-6">
                {i === 0 && <AiThinking label={`Rewriting for ${targets.length} platforms`} />}
                <div className="skeleton h-5 w-1/2 rounded" />
                <div className="skeleton h-24 w-full rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && out && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold">
                1 source → {out.length} ready-to-post drafts
              </h2>
              <SourceBadge source={src} />
            </div>
            <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
              {out.map((o, i) => (
                <article key={i} className="mb-5 break-inside-avoid animate-slide-up rounded-2xl border border-line-soft p-5" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <PlatformGlyph platform={o.platform} size={16} /> {o.platform === "youtube" ? "YouTube Shorts" : PLATFORMS[o.platform]?.label}
                    </span>
                    <span className="text-xs text-ink-2">
                      {o.format} · {o.content.length} chars
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{o.content}</p>
                  <div className="mt-4 flex justify-end gap-2 border-t border-line-soft pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard?.writeText(o.content).catch(() => {});
                        setCopied(i);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                    >
                      {copied === i ? <Check className="size-4" /> : <Copy className="size-4" />} {copied === i ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="dark" onClick={() => setSchedule({ title: o.content.split("\n")[0].replace(/^(HOOK.*?:|Slide 1:|Subject:|1\/)\s*/i, "").slice(0, 70), platform: o.platform, format: o.format, effort: 1 })}>
                      <CalendarPlus className="size-4" /> Schedule
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {!loading && !out && (
          <EmptyState Icon={Repeat2} title="Make once, publish everywhere" text="Turn one long video into native posts for every platform — hooks, carousels, threads and newsletter sections, each in the format that platform rewards." />
        )}
      </div>
      <ScheduleModal draft={schedule} onClose={() => setSchedule(null)} />
    </>
  );
}

function EmptyState({ Icon, title, text }: { Icon: typeof Lightbulb; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-white shadow-soft">
        <Icon className="size-6" />
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-ink-2">{text}</p>
    </div>
  );
}
