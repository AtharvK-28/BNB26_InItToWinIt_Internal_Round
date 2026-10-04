/**
 * Local engine for the growth & operations tasks (titles, feedback replies,
 * campaign reports, DM automations). Same shapes as the Claude outputs.
 */
import { seeded } from "../utils";
import type { DmInput, DmOut, EmailOut, FeedbackInput, ReportInput, ReportOut, TitlesInput, TitlesOut } from "./schemas";

const first = (s: string) => s.split(" ")[0];
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/* ---------------------------------- Titles --------------------------------- */

function cleanTopic(t: string) {
  const s = t.trim().replace(/[.?!]+$/, "");
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function localTitles(i: TitlesInput): TitlesOut {
  const t = cleanTopic(i.topic || "my desk setup");
  const r = seeded(t);
  const T = t.charAt(0).toUpperCase() + t.slice(1);
  const base = [
    { title: `I was wrong about ${t}`, thumbnailText: "I WAS WRONG", angle: "Contrarian", why: "Admitting a reversal creates instant curiosity — and matches your honest-review reputation." },
    { title: `${T}: 30 days later`, thumbnailText: "30 DAYS LATER", angle: "Challenge", why: "Long-term tests are your strongest format; the time stamp promises proof, not hype." },
    { title: `The ${t} mistake almost everyone makes`, thumbnailText: "STOP DOING THIS", angle: "Curiosity", why: "Loss-aversion framing — viewers click to check they're not the one making the mistake." },
    { title: `$50 vs $500 ${t} — can you tell?`, thumbnailText: "$50 vs $500", angle: "Comparison", why: "Price contrast is the most reliable click driver in your niche's outlier videos." },
    { title: `What ${t} actually changed for me`, thumbnailText: "WORTH IT?", angle: "Personal", why: "Personal outcome over specs — your audience follows you for your take, not the spec sheet." },
    { title: `5 ${t} upgrades I'd buy again`, thumbnailText: "BUY AGAIN", angle: "Number", why: "Numbered lists set clear expectations; 'buy again' signals tested, not sponsored." },
  ];
  return {
    variants: base
      .map((v) => {
        const len = v.title.length;
        const fit = len >= 30 && len <= 65 ? 8 : 0;
        return { ...v, score: Math.min(97, Math.round(64 + r() * 22 + fit)) };
      })
      .sort((a, b) => b.score - a.score),
  };
}

/* --------------------------------- Feedback -------------------------------- */

export function localFeedback(i: FeedbackInput): EmailOut {
  const inScope = i.comments.filter((c) => c.scope === "in");
  const out = i.comments.filter((c) => c.scope === "out");
  const praise = i.comments.some((c) => c.scope === "praise");
  const lines = [
    `Hi ${first(i.contact)},`,
    "",
    `Thanks for the thoughtful notes${praise ? " — and glad the cold open landed!" : "!"}`,
    "",
    ...(inScope.length ? ["Here's what I'll change in v2:", ...inScope.map((c) => `• ${c.text.replace(/^(could you|can you|please)\s*/i, "").replace(/\?$/, "")} [${c.at}]`), ""] : []),
    ...(out.length
      ? [
          `One note: ${out.map((c) => `“${c.text.replace(/^also\s*[—-]\s*/i, "")}”`).join(" and ")} goes beyond the deliverables in our agreement. Happy to do it as an add-on for ${usd(i.extraFee)}, or as a separate Short if that's easier for your team.`,
          "",
        ]
      : []),
    `The revised cut will be with you within 2 business days. This will be revision round ${i.roundsUsed + 1} of ${i.roundsIncluded}.`,
    "",
    "Best,",
    first(i.creator.name),
  ];
  return { subject: `Re: draft feedback — v2 on the way`, body: lines.join("\n") };
}

/* ---------------------------------- Report --------------------------------- */

export function localReport(i: ReportInput): ReportOut {
  const m = i.metrics;
  const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
  return {
    summary: `${i.campaign} reached ${m.views.toLocaleString("en-US")} viewers with an average view duration of ${m.avgViewDuration}. The standout: ${pct(m.integrationRetention, 0)} of viewers stayed through the ${i.brand} segment, and ${m.clicks.toLocaleString("en-US")} clicked through (${pct(m.ctr, 2)} CTR), driving ${m.conversions} conversions. ${pct(m.sentiment, 0)} of comments mentioning ${i.brand} were positive.`,
    highlights: [
      `${m.views.toLocaleString("en-US")} views · ${m.avgViewDuration} average view duration`,
      `${pct(m.integrationRetention, 0)} retention through the sponsor segment`,
      `${m.clicks.toLocaleString("en-US")} clicks at ${pct(m.ctr, 2)} CTR → ${m.conversions} conversions`,
      ...(i.bonus ? [i.bonus] : []),
    ],
    nextPitch: `Given the click-through, a follow-up "30 days later" video with ${i.brand} would let viewers who clicked see the long-term verdict — a natural Q4 sequel.`,
  };
}

/* ------------------------------------ DM ----------------------------------- */

export function localDm(i: DmInput): DmOut {
  const t = i.post.toLowerCase();
  const keyword = /gear|setup|desk|upgrade|list/.test(t) ? "LIST" : /guide|how|tips|learn/.test(t) ? "GUIDE" : /deal|discount|code/.test(t) ? "CODE" : "LINK";
  const r = seeded(i.post);
  const openers = ["Hey! 👋", "Here you go! 🙌", "Got you! ✨"];
  return {
    keyword,
    message: `${openers[Math.floor(r() * openers.length)]} ${keyword === "LIST" ? "Everything from the video, with links" : keyword === "GUIDE" ? "Here's the full guide" : keyword === "CODE" ? "Here's your code and link" : "Here's the link"}: {link} — reply here if you have any questions!`.slice(0, 280),
  };
}
