"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, Check, CircleDollarSign, Flame, Inbox, LoaderCircle, Minus, Plus, Sprout, TrendingUp } from "lucide-react";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Logo } from "@/components/ui/Logo";
import { Photo } from "@/components/ui/Media";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { CREATOR } from "@/lib/data/creator";
import { CATEGORIES, PLATFORMS } from "@/lib/data/meta";
import { useApp } from "@/lib/store";
import type { Category, Platform } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

const GOALS = [
  { id: "Land better brand deals", Icon: CircleDollarSign },
  { id: "Post consistently without burning out", Icon: Flame },
  { id: "Get paid on time", Icon: Banknote },
  { id: "Grow my audience", Icon: TrendingUp },
  { id: "Diversify my income", Icon: Sprout },
  { id: "Spend less time in my inbox", Icon: Inbox },
];

const CONNECTABLE: Platform[] = ["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter", "twitch", "podcast"];
const STEPS = 6;

export default function Onboarding() {
  const router = useRouter();
  const complete = useApp((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState<Platform[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [niches, setNiches] = useState<Category[]>(["tech", "education"]);
  const [goals, setGoals] = useState<string[]>(["Land better brand deals", "Post consistently without burning out"]);
  const [hours, setHours] = useState(32);
  const [posts, setPosts] = useState(6);
  const [rest, setRest] = useState(1);

  const canNext = step !== 1 || connected.length > 0;

  const connect = (p: Platform) => {
    if (connected.includes(p)) return setConnected((c) => c.filter((x) => x !== p));
    setConnecting(p);
    setTimeout(() => {
      setConnected((c) => [...c, p]);
      setConnecting(null);
    }, 900);
  };

  const finish = () => {
    complete({ niches, goals, weeklyCapacityHours: hours });
    router.push("/studio");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 items-center justify-between px-6 md:px-12">
        <Logo href="/" />
        <div className="flex gap-3">
          <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink">Questions?</button>
          <Link href="/studio" className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink">
            Save & exit
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-36">
        {step === 0 && (
          <div className="grid w-full max-w-[1120px] animate-fade-in items-center gap-12 md:grid-cols-2">
            <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight md:text-[56px]">It&apos;s easy to run your creator business on CreatorAI</h1>
            <ol className="divide-y divide-line-soft">
              {[
                { n: 1, t: "Connect your platforms", d: "YouTube, TikTok, Instagram and more — so your stats, rates and media kit stay live.", img: "deskWindow" as const },
                { n: 2, t: "Tell us what you make", d: "Your niche, your goals and how much time you really have each week.", img: "studioMic" as const },
                { n: 3, t: "Meet your AI team", d: "A copilot that drafts pitches, checks contracts, chases payments and protects your rest days.", img: "uiDesign" as const },
              ].map((s) => (
                <li key={s.n} className="flex gap-4 py-6">
                  <span className="text-[22px] font-semibold">{s.n}</span>
                  <div className="flex-1">
                    <h2 className="text-[22px] font-semibold">{s.t}</h2>
                    <p className="mt-1 text-ink-2">{s.d}</p>
                  </div>
                  <Photo k={s.img} w={240} h={240} className="size-24 shrink-0 rounded-xl" />
                </li>
              ))}
            </ol>
          </div>
        )}

        {step === 1 && (
          <Step title="Connect your platforms" sub="Read-only access to stats — we never post without asking.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CONNECTABLE.map((p) => {
                const on = connected.includes(p);
                const stat = CREATOR.platforms.find((x) => x.platform === p);
                return (
                  <button
                    key={p}
                    onClick={() => connect(p)}
                    className={cn("flex flex-col items-start gap-6 rounded-xl border p-4 text-left transition", on ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink")}
                  >
                    <PlatformGlyph platform={p} size={28} />
                    <span>
                      <span className="block font-semibold">{PLATFORMS[p].label}</span>
                      <span className="block text-sm text-ink-2">
                        {connecting === p ? (
                          <span className="inline-flex items-center gap-1">
                            <LoaderCircle className="size-3 animate-spin" /> Connecting…
                          </span>
                        ) : on ? (
                          <span className="inline-flex items-center gap-1 text-babu">
                            <Check className="size-3.5" strokeWidth={3} /> {stat ? `${compact(stat.followers)} followers` : "Connected"}
                          </span>
                        ) : (
                          "Connect"
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setConnected(CREATOR.platforms.map((p) => p.platform))} className="mt-4 text-sm font-semibold underline underline-offset-2">
              Connect all demo accounts
            </button>
          </Step>
        )}

        {step === 2 && (
          <Step title="Which of these best describes your content?" sub="Pick up to three — this shapes your deal matches and ideas.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => {
                const on = niches.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setNiches((n) => (on ? n.filter((x) => x !== c.id) : n.length < 3 ? [...n, c.id] : n))}
                    className={cn("flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition", on ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink")}
                  >
                    <CategoryIcon c={c.id} className="size-8" />
                    <span className="font-semibold">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="What should CreatorAI take off your plate?" sub="Choose as many as you like.">
            <div className="grid gap-3 sm:grid-cols-2">
              {GOALS.map(({ id, Icon }) => {
                const on = goals.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => setGoals((g) => (on ? g.filter((x) => x !== id) : [...g, id]))}
                    className={cn("flex items-center justify-between gap-4 rounded-xl border p-5 text-left transition", on ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink")}
                  >
                    <span className="text-[17px] font-semibold">{id}</span>
                    <Icon className="size-7 shrink-0" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step title="Let's set a sustainable pace" sub="We plan around your real capacity — and protect your rest days.">
            <div className="divide-y divide-line-soft">
              <Counter label="Hours per week for content" value={hours} set={setHours} min={5} max={60} step={2} />
              <Counter label="Posts per week (all platforms)" value={posts} set={setPosts} min={1} max={21} />
              <Counter label="Rest days per week" value={rest} set={setRest} min={0} max={3} />
            </div>
            <p className="mt-6 flex gap-2 rounded-xl bg-surface p-4 text-sm">
              <AiSpark className="mt-0.5 size-4 shrink-0" />
              {posts / Math.max(1, hours) > 0.4
                ? "That's ambitious. We'll suggest repurposing so one shoot covers several posts."
                : "That's a healthy pace. We'll warn you before a week gets overloaded."}
            </p>
          </Step>
        )}

        {step === 5 && <Analyzing niches={niches} connected={connected.length} />}
      </main>

      <footer className="fixed inset-x-0 bottom-0 bg-white">
        <div className="flex gap-2 px-0">
          {[...Array(STEPS)].map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden bg-line-soft">
              <div className="h-full bg-ink transition-all duration-500" style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-4 md:px-12">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} className={cn("text-base font-semibold underline underline-offset-2", step === 0 && "invisible")}>
            Back
          </button>
          {step < STEPS - 1 ? (
            <Button variant={step === 0 ? "rausch" : "dark"} size="lg" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              {step === 0 ? "Get started" : "Next"}
            </Button>
          ) : (
            <Button variant="rausch" size="lg" onClick={finish}>
              Open my Studio
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[640px] animate-slide-up py-10">
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 mb-8 text-lg text-ink-2">{sub}</p>
      {children}
    </div>
  );
}

function Counter({ label, value, set, min, max, step = 1 }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="flex items-center justify-between py-6">
      <span className="text-lg">{label}</span>
      <div className="flex items-center gap-4">
        <button aria-label="Decrease" disabled={value <= min} onClick={() => set(Math.max(min, value - step))} className="flex size-9 items-center justify-center rounded-full border border-[#b0b0b0] hover:border-ink disabled:opacity-30">
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-lg">{value}</span>
        <button aria-label="Increase" disabled={value >= max} onClick={() => set(Math.min(max, value + step))} className="flex size-9 items-center justify-center rounded-full border border-[#b0b0b0] hover:border-ink disabled:opacity-30">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Analyzing({ niches, connected }: { niches: Category[]; connected: number }) {
  const lines = [
    `Read your last 50 posts across ${connected || 6} platforms`,
    "Learned your voice: warm, witty, data-backed",
    `Matched 6 brand deals in ${niches.map((n) => CATEGORIES.find((c) => c.id === n)?.label).join(" & ")}`,
    "Calculated your fair rates from live stats",
    "Found 1 overdue invoice and drafted a reminder",
    "Flagged 1 contract with risky clauses",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= lines.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [done, lines.length]);
  return (
    <div className="w-full max-w-[560px] animate-slide-up py-10">
      <div className="ai-bg mb-6 flex size-14 items-center justify-center rounded-2xl">
        <AiSpark className="size-7 [&_path]:fill-white" />
      </div>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{done < lines.length ? "Setting up your AI team…" : "Your AI team is ready"}</h1>
      <ul className="mt-8 space-y-4">
        {lines.map((l, i) => (
          <li key={l} className={cn("flex items-center gap-3 text-[17px] transition-opacity duration-300", i < done ? "opacity-100" : i === done ? "opacity-60" : "opacity-20")}>
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", i < done ? "bg-ink text-white" : "border border-line")}>
              {i < done ? <Check className="size-3.5" strokeWidth={3} /> : i === done ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
            </span>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
