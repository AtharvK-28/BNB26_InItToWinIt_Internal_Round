"use client";

import { useState } from "react";
import { Eye, FileUp, Heart, MessageCircle, Repeat, Sparkles } from "lucide-react";
import { ChartFrame, Heatmap, Sparkline } from "@/components/charts/Charts";
import { Card, PageTitle, StudioPage } from "@/components/studio/Shell";
import { StatsImport } from "@/components/studio/StatsImport";
import { SuperCreatorCard } from "@/components/studio/SuperCreatorCard";
import { ProductionInsights } from "@/components/video/ProductionInsights";
import { AiSpark } from "@/components/ui/Ai";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformBadge, PlatformGlyph } from "@/components/ui/PlatformIcon";
import { totalFollowers } from "@/lib/data/creator";
import { PLATFORMS } from "@/lib/data/meta";
import { BEST_TIMES, FOLLOWER_TREND, POSTS } from "@/lib/data/studio";
import { bestTimes, engagement, topPosts } from "@/lib/logic/postStats";
import { useApp, useUi } from "@/lib/store";
import type { ImportedPost, PostPerf } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

const WEEKS = [...Array(12).keys()].map((i) => (i === 11 ? "this week" : `${11 - i} wk ago`));
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["6a", "9a", "12p", "3p", "6p", "9p"];
const SLOT_LABEL = ["6–9am", "9am–12pm", "12–3pm", "3–6pm", "6–9pm", "9pm–late"];

/** Marks numbers that come from the demo workspace rather than the creator's accounts. */
function SampleTag({ hint }: { hint: string }) {
  return (
    <span title={hint} className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber">
      Sample data
    </span>
  );
}

export default function InsightsPage() {
  return (
    <StudioPage>
      <Insights />
    </StudioPage>
  );
}

function Insights() {
  const profile = useApp((s) => s.profile);
  const openCopilot = useUi((s) => s.openCopilot);
  const [post, setPost] = useState<PostPerf | null>(null);
  const [importing, setImporting] = useState(false);
  const imported = useApp((s) => s.postStats);
  const setPostStats = useApp((s) => s.setPostStats);
  const total = totalFollowers(profile);
  const own = imported.length > 0;
  const times = (own && bestTimes(imported)) || null;
  const grid = times ?? BEST_TIMES;
  const best = grid.flatMap((r, i) => r.map((v, j) => ({ v, i, j }))).sort((a, b) => b.v - a.v)[0];

  return (
    <>
      <PageTitle title="Insights" sub={`${compact(total)} people follow you across ${profile.platforms.length} platforms`} right={<Button variant="outline" onClick={() => openCopilot("How is my audience growing and what should I do next?")}><AiSpark className="size-4" /> Explain my growth</Button>} />

      <div className="mb-10">
        <ProductionInsights />
      </div>

      <div className="mb-10">
        <SuperCreatorCard />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-[22px] font-semibold">Audience by platform</h2>
        <SampleTag hint="Follower counts and growth come from the demo workspace until platform accounts are connected." />
      </div>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile.platforms.map((p) => (
          <Card key={p.platform} className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <PlatformBadge platform={p.platform} size={26} />
                {PLATFORMS[p.platform].label}
              </span>
              <span className={cn("text-sm font-semibold", p.growth30d >= 0.03 ? "text-babu" : "text-ink-2")}>+{(p.growth30d * 100).toFixed(1)}% · 30d</span>
            </div>
            <div className="mt-4 text-[28px] leading-none font-semibold">{compact(p.followers)}</div>
            <div className="mt-1 text-xs text-ink-2">{p.platform === "newsletter" ? "subscribers" : "followers"}</div>
            <ChartFrame className="mt-3">
              <Sparkline values={FOLLOWER_TREND[p.platform]} labels={WEEKS} format={(n) => compact(n)} height={44} />
            </ChartFrame>
            <div className="mt-3 flex justify-between border-t border-line-soft pt-3 text-xs text-ink-2">
              <span>
                {p.platform === "newsletter" ? "Open rate" : "Engagement"} <b className="text-ink">{(p.engagement * 100).toFixed(1)}%</b>
              </span>
              <span>
                Avg. {p.platform === "newsletter" ? "opens" : "views"} <b className="text-ink">{compact(p.avgViews)}</b>
              </span>
            </div>
          </Card>
        ))}
      </div>

      <section className="mb-10">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] font-semibold">What&apos;s working</h2>
            {!own && <SampleTag hint="Import a CSV of your post stats to replace these examples." />}
          </div>
          <div className="flex items-center gap-3">
            {own && (
              <button onClick={() => setPostStats([])} className="text-sm font-semibold underline underline-offset-2">
                Clear imported stats
              </button>
            )}
            <Button variant="outline" size="sm" onClick={() => setImporting(true)}>
              <FileUp className="size-4" /> {own ? "Re-import stats" : "Import your stats"}
            </Button>
          </div>
        </div>
        <p className="mb-5 text-sm text-ink-2">
          {own ? `Your top posts out of ${imported.length} imported, compared with your own average views.` : "Example posts compared with an average. Import your stats (CSV) to see your own."}
        </p>
        {own ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topPosts(imported).map((p) => (
              <ImportedCard key={p.id} post={p} onFollowUp={() => openCopilot(`Give me 3 follow-up video ideas based on my post "${p.title}", which got ${p.vsAvg.toFixed(1)}x my average views.`)} />
            ))}
          </div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <button key={p.id} onClick={() => setPost(p)} className="group text-left">
              <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Photo k={p.thumb} w={640} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow">{p.vsAvg.toFixed(1)}× your avg</span>
                <span className="absolute right-3 bottom-3">
                  <PlatformBadge platform={p.platform} size={28} />
                </span>
              </div>
              <div className="mt-3 font-semibold">{p.title}</div>
              <div className="flex gap-4 text-sm text-ink-2">
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" /> {compact(p.views)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3.5" /> {compact(p.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="size-3.5" /> {compact(p.comments)}
                </span>
                <span>{p.daysAgo}d ago</span>
              </div>
            </button>
          ))}
        </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Best time to post</h2>
            {!times && <SampleTag hint={own ? "Your export has no posting times, so this uses example data." : "Import your stats with publish times to compute this from your posts."} />}
          </div>
          <p className="mb-5 text-sm text-ink-2">{times ? "Average views of your imported posts by day and posting time (your local time)" : "When your audience engages most (your local time, all platforms)"}</p>
          <Heatmap rows={DAYS} cols={SLOTS} values={grid} />
          <p className="mt-4 flex gap-2 rounded-xl bg-surface p-3 text-sm">
            <AiSpark className="mt-0.5 size-4 shrink-0" />
            <span>
              Your strongest slot is <b>{DAYS[best.i]} {SLOT_LABEL[best.j]}</b>
              {times ? " — based on what your posts actually did." : "."}
            </span>
          </p>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Your audience</h2>
            <SampleTag hint="Audience age and countries come from the demo workspace until platform accounts are connected." />
          </div>
          <p className="mb-5 text-sm text-ink-2">Across connected platforms</p>
          <h3 className="mb-2 text-sm font-semibold">Age</h3>
          <Bars items={profile.audience.age} />
          <h3 className="mt-6 mb-2 text-sm font-semibold">Top countries</h3>
          <Bars items={profile.audience.countries} />
        </Card>
      </div>

      <StatsImport open={importing} onClose={() => setImporting(false)} />

      <Modal open={Boolean(post)} onClose={() => setPost(null)} title="Why this worked" width={620}>
        {post && (
          <div className="p-6">
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <Photo k={post.thumb} w={1000} className="absolute inset-0" />
            </div>
            <h3 className="mt-5 flex items-center gap-2 text-xl font-semibold">
              <PlatformGlyph platform={post.platform} size={18} /> {post.title}
            </h3>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                { Icon: Eye, v: compact(post.views), l: "views" },
                { Icon: Heart, v: compact(post.likes), l: "likes" },
                { Icon: MessageCircle, v: compact(post.comments), l: "comments" },
                { Icon: Repeat, v: compact(post.shares), l: "shares" },
              ].map(({ Icon, v, l }) => (
                <div key={l} className="rounded-xl bg-surface p-3">
                  <Icon className="mx-auto size-4 text-ink-2" />
                  <div className="mt-1 font-semibold">{v}</div>
                  <div className="text-xs text-ink-2">{l}</div>
                </div>
              ))}
            </div>
            <div className="ai-border mt-5 rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AiSpark className="size-4" /> {post.vsAvg.toFixed(1)}× your average — here&apos;s why
              </div>
              <p className="text-[15px] leading-relaxed">{post.why}</p>
            </div>
            <Button
              variant="dark"
              className="mt-5 w-full"
              onClick={() => {
                setPost(null);
                openCopilot(`Give me 3 follow-up video ideas based on my post "${post.title}", which did ${post.vsAvg.toFixed(1)}x my average.`);
              }}
            >
              <Sparkles className="size-4" /> Make a follow-up while it&apos;s hot
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm" title={`${i.label}: ${Math.round(i.value * 100)}%`}>
          <span className="truncate text-ink-2">{i.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums">{Math.round(i.value * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

function ImportedCard({ post, onFollowUp }: { post: ImportedPost & { vsAvg: number }; onFollowUp: () => void }) {
  const when = post.published ? new Date(post.published) : null;
  return (
    <article className="rounded-2xl border border-line-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <PlatformBadge platform={post.platform} size={30} />
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold">{post.vsAvg.toFixed(1)}× your avg</span>
      </div>
      <div className="mt-4 line-clamp-2 font-semibold">{post.title}</div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" /> {compact(post.views)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" /> {compact(post.likes)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-3.5" /> {compact(post.comments)}
        </span>
        {when && <span>{when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>}
      </div>
      <p className="mt-3 text-sm">
        <b>{(engagement(post) * 100).toFixed(1)}%</b> engagement (likes, comments and shares per view).
      </p>
      <button onClick={onFollowUp} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2">
        <Sparkles className="size-3.5" /> Ideas for a follow-up
      </button>
    </article>
  );
}
