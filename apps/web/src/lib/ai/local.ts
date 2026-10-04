/**
 * CreatorAI local engine — deterministic, template-driven generators that mirror the
 * Claude task outputs. Used when no API credentials are configured or a call fails,
 * so every feature in the demo keeps working offline.
 */
import { scanContract } from "../logic/contract";
import { seeded } from "../utils";
import type {
  BioInput,
  BioOut,
  ContractInput,
  ContractOut,
  CopilotContext,
  CounterInput,
  CreatorBrief,
  EmailOut,
  IdeasInput,
  IdeasOut,
  PitchInput,
  ReminderInput,
  RepliesOut,
  ReplyInput,
  RepurposeInput,
  RepurposeOut,
  ScriptInput,
  ScriptOut,
} from "./schemas";

type P = IdeasOut["ideas"][number]["platform"];

const fmt = (n: number) => n.toLocaleString("en-US");
const usd = (n: number) => `$${fmt(Math.round(n))}`;
const first = (name: string) => name.split(" ")[0];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const NICHE_TOPICS: Record<string, string[]> = {
  tech: ["desk setups", "budget monitors", "cable management", "mechanical keyboards", "AI gadgets", "home-office lighting", "USB-C hubs", "noise-cancelling headphones"],
  education: ["learning to code", "study systems", "career switching", "note-taking apps", "deep work"],
  beauty: ["skincare routines", "drugstore dupes", "5-minute makeup"],
  fitness: ["home workouts", "strength training", "recovery tools"],
  gaming: ["streaming setups", "budget gaming PCs", "cozy games"],
  food: ["15-minute dinners", "meal prep", "coffee at home"],
  travel: ["carry-on packing", "remote-work cities", "travel gear"],
  finance: ["creator taxes", "budgeting apps", "first-year income"],
};

function topicFrom(input: { prompt: string; niches: string[] }, r: () => number) {
  const p = input.prompt.trim().replace(/[.?!]+$/, "");
  if (p.length > 2) {
    const cleaned = p
      .replace(/^(give me|i want|make|create|write|ideas? (for|about)|something about|videos? (about|on)|content (about|on))\s+/i, "")
      .replace(/\b(ideas?|videos?|content|posts?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length > 2) {
      const t = cleaned.length > 42 ? cleaned.slice(0, 42).replace(/\s\S*$/, "") : cleaned;
      // Lower-case the first letter so the topic reads naturally mid-sentence (keep acronyms like "AI").
      return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
    }
  }
  const pool = input.niches.flatMap((n) => NICHE_TOPICS[n.toLowerCase()] ?? []);
  const list = pool.length ? pool : NICHE_TOPICS.tech;
  return list[Math.floor(r() * list.length)];
}

/* ---------------------------------- Ideas ---------------------------------- */

const IDEA_TEMPLATES: { platform: P; format: string; effort: number; title: (t: string) => string; hook: (t: string) => string; why: (t: string) => string }[] = [
  {
    platform: "youtube",
    format: "Long video",
    effort: 8,
    title: (t) => `I tried ${t} for 30 days — here's what actually changed`,
    hook: (t) => `Thirty days ago I was sure ${t} was overhyped. Day 19 changed my mind.`,
    why: () => "Long-term-test videos average 2.4× your channel views — your audience rewards patience over first impressions.",
  },
  {
    platform: "tiktok",
    format: "Short",
    effort: 1,
    title: (t) => `3 mistakes everyone makes with ${t} (and the $0 fix)`,
    hook: () => "You're doing this wrong, and it's costing you every single day.",
    why: () => "Mistake-list Shorts get 41% more shares in your niche; the $0 fix makes it instantly actionable.",
  },
  {
    platform: "youtube",
    format: "Long video",
    effort: 6,
    title: (t) => `${cap(t)}: $50 vs $500 — can you tell the difference?`,
    hook: () => "One of these costs ten times more. By the end, you'll know which — or you won't.",
    why: () => "Blind tests drive comments (+2.1× vs. reviews) and the price gap is built-in curiosity.",
  },
  {
    platform: "instagram",
    format: "Carousel",
    effort: 2,
    title: (t) => `My honest ${t} tier list (with prices)`,
    hook: (t) => `Ranked every ${t} pick I've tested. Slide 6 will start an argument.`,
    why: () => "Your numbered carousels get 3.4× more saves than Reels — saves are Instagram's strongest signal right now.",
  },
  {
    platform: "linkedin",
    format: "Post",
    effort: 1,
    title: (t) => `What ${t} taught me about running a creator business`,
    hook: () => "I made a $4,000 mistake so you don't have to.",
    why: () => "Personal-story posts with real numbers are your best LinkedIn format (4.4× average reach).",
  },
  {
    platform: "x",
    format: "Thread",
    effort: 1,
    title: (t) => `Thread: the real cost of ${t}`,
    hook: (t) => `Everyone shows you the ${t}. Nobody shows you the receipts. 🧵`,
    why: () => "Cost-breakdown threads are bookmarked 3× more than opinion threads on your account.",
  },
  {
    platform: "tiktok",
    format: "Short",
    effort: 1.5,
    title: (t) => `Stop buying ${t} until you watch this`,
    hook: () => "Please don't hit 'buy' yet. Give me 40 seconds.",
    why: () => "Pattern-interrupt hooks hold 81% of viewers past 3 seconds on your TikTok.",
  },
  {
    platform: "newsletter",
    format: "Newsletter",
    effort: 2,
    title: (t) => `Desk Notes: the ${t} guide I wish I had`,
    hook: (t) => `This week: everything I've learned about ${t}, in one email.`,
    why: () => "Guide-style issues have your highest click-through (11.2%) and convert affiliates best.",
  },
  {
    platform: "youtube",
    format: "Short",
    effort: 1,
    title: (t) => `The ${t} upgrade nobody talks about`,
    hook: () => "This is the cheapest upgrade I've ever made — and the one I'd buy again first.",
    why: () => "Search for this topic is up 38% month-over-month; Shorts can rank in search now.",
  },
];

export function localIdeas(i: IdeasInput): IdeasOut {
  const r = seeded(`${i.prompt}|${i.platform}|${i.creator.handle}`);
  const topic = topicFrom({ prompt: i.prompt, niches: i.creator.niches }, r);
  let pool = IDEA_TEMPLATES;
  if (i.platform !== "any") {
    const same = IDEA_TEMPLATES.filter((t) => t.platform === i.platform);
    pool = same.length >= 2 ? same : IDEA_TEMPLATES;
  }
  const shuffled = [...pool].sort(() => r() - 0.5);
  const picks: typeof IDEA_TEMPLATES = [];
  while (picks.length < 6) picks.push(shuffled[picks.length % shuffled.length]);
  const seen = new Set<string>();
  return {
    ideas: picks
      .map((t, k) => {
        const platform = (i.platform !== "any" ? i.platform : t.platform) as P;
        const title = k >= shuffled.length ? `${t.title(topic)} (part 2)` : t.title(topic);
        return {
          title,
          hook: t.hook(topic),
          platform,
          format: platform === t.platform ? t.format : platform === "youtube" ? "Long video" : platform === "instagram" ? "Reel" : t.format,
          why: t.why(topic),
          score: Math.round(62 + r() * 34),
          effort: t.effort,
        };
      })
      .filter((x) => (seen.has(x.title) ? false : (seen.add(x.title), true)))
      .sort((a, b) => b.score - a.score),
  };
}

/* ---------------------------------- Script --------------------------------- */

export function localScript(i: ScriptInput): ScriptOut {
  const idea = i.idea.replace(/\s+/g, " ").trim();
  const short = ["tiktok", "instagram"].includes(i.platform) || /short|reel/i.test(idea);
  const subject = idea.replace(/^(i |my |the |why |how )/i, "").replace(/[—:].*$/, "").trim();
  if (short) {
    return {
      title: idea,
      hook: `Don't scroll — this ${subject.split(" ").slice(0, 4).join(" ")} trick takes 10 seconds and I wish I'd known it sooner.`,
      sections: [
        { heading: "Hook (0:00–0:03)", beats: ["Close-up, mid-action. Say the hook before the first cut.", "On-screen text: the problem in 5 words."], broll: "Macro shot of the 'before' mess" },
        { heading: "The problem (0:03–0:10)", beats: ["Show the frustrating 'before' in one quick pan.", "Relatable line: 'If your setup looks like this, same.'"], broll: "Quick zoom + whoosh SFX" },
        { heading: "The fix (0:10–0:35)", beats: ["Three fast steps, one cut per step.", "Name the exact product or setting on screen.", "Keep hands in frame — tactile content holds attention."], broll: "Overhead top-down, satisfying click sounds" },
        ...(i.sponsor ? [{ heading: "Sponsor moment (0:35–0:42)", beats: [`Natural mention: 'I use ${i.sponsor} for this part' while doing the step.`, "On-screen: brand name + code."], broll: "Product in use, not on a table" }] : []),
        { heading: "Payoff (0:42–0:50)", beats: ["Reveal the 'after' with a beat drop.", "Loop the last frame into the first so it replays."], broll: "Slow push-in on the final result" },
      ],
      cta: "Comment 'LIST' and I'll pin every product I used.",
      thumbnailIdeas: ["10-second fix", "Why didn't I know?", "Before → after"],
    };
  }
  return {
    title: idea,
    hook: `I was wrong about ${subject.toLowerCase()}. Here's exactly where — with receipts.`,
    sections: [
      { heading: "Cold open (0:00–0:15)", beats: ["Start with the result or the surprising moment — no intro.", "Tease the one thing that changed your mind."], broll: "Fast montage of the 3 best shots from the video" },
      { heading: "Context (0:15–1:00)", beats: ["Why this matters to your viewer, in one sentence.", "Your setup and how you tested it (be specific: days, conditions).", "Set expectations: 'By the end you'll know if it's worth it.'"], broll: "Wide desk shot, slow slider move" },
      { heading: "What worked (1:00–3:30)", beats: ["Three strengths, each with a real-world example.", "Show, then tell — demo before you explain."], broll: "Close-ups of each feature in use" },
      ...(i.sponsor
        ? [{ heading: `Sponsor: ${i.sponsor} (3:30–4:30)`, beats: ["Bridge from the last point: connect the sponsor to the problem you just solved.", "One personal use case, one clear benefit, one offer.", "Keep it under 60 seconds and on-camera."], broll: "Product in your real workflow" }]
        : []),
      { heading: "What didn't (4:30–6:00)", beats: ["Two honest drawbacks — this is where trust is built.", "Who should NOT buy/try this."], broll: "Side-by-side comparison" },
      { heading: "Verdict (6:00–7:00)", beats: ["One-line verdict + score.", "The alternative you'd pick at half the price."], broll: "Hero shot, warm light" },
    ],
    cta: "If this saved you money, the full list is in Desk Notes — link below. Next week: the setup I'd build from scratch for $500.",
    thumbnailIdeas: ["I was wrong", "30 days later…", "Worth it?"],
  };
}

/* -------------------------------- Repurpose -------------------------------- */

function keyPoints(source: string, r: () => number): string[] {
  const sentences = source
    .replace(/\n+/g, ". ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/^[-•*\d.)\s]+/, ""))
    .filter((s) => s.split(" ").length >= 5 && s.split(" ").length <= 40);
  if (sentences.length >= 3) {
    return sentences
      .map((s, idx) => ({ s, w: s.length * (/\d/.test(s) ? 1.4 : 1) * (idx < 3 ? 1.2 : 1) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 5)
      .map((x) => x.s.replace(/[.!?]+$/, ""));
  }
  const t = source.trim().replace(/[.?!]+$/, "") || "my setup";
  const generic = [
    `The biggest change came from the smallest part of ${t.toLowerCase()}`,
    "Spending more didn't fix it — changing the order of things did",
    "Two weeks in, I stopped noticing it, which is exactly the point",
    "The one thing I'd skip if I were starting over",
    "What it actually cost, including the stuff I returned",
  ];
  return generic.sort(() => r() - 0.5).slice(0, 4);
}

function titleFrom(source: string) {
  const firstLine = source.trim().split(/\n|(?<=[.!?])\s/)[0] ?? "";
  return firstLine.length > 70 ? firstLine.slice(0, 70).replace(/\s\S*$/, "") + "…" : firstLine.replace(/[.]+$/, "");
}

export function localRepurpose(i: RepurposeInput): RepurposeOut {
  const r = seeded(i.source.slice(0, 200));
  const pts = keyPoints(i.source, r);
  const title = titleFrom(i.source) || "My latest video";
  const out: RepurposeOut["outputs"] = [];
  for (const p of i.platforms as P[]) {
    switch (p) {
      case "tiktok":
      case "youtube":
        out.push({
          platform: p,
          format: p === "tiktok" ? "TikTok script" : "YouTube Short",
          content: `HOOK (0–3s): "${title}." — straight to camera, no intro.\n[on-screen: "${title.slice(0, 32)}"]\n\nBEAT 1: ${pts[1] ?? pts[0]}.\n[cut to close-up]\n\nBEAT 2: ${pts[2] ?? "Here's the part nobody mentions"}.\n[on-screen: the key number]\n\nPAYOFF: ${pts[3] ?? "And that's why I'm never going back"}.\n\nCTA: ${p === "tiktok" ? "Follow for part 2 — I'm testing the cheaper version next." : "Full video on my channel — subscribe so you don't miss part 2."}\n\nCaption: ${pts[0]} 👀 #${i.creator.niches[0] ?? "creator"} #setup #lifehack`,
        });
        break;
      case "instagram":
        out.push({
          platform: p,
          format: "Carousel + caption",
          content: `Slide 1: ${title}\nSlide 2: ${pts[0]}\nSlide 3: ${pts[1] ?? "The surprising part"}\nSlide 4: ${pts[2] ?? "What I'd do differently"}\nSlide 5: ${pts[3] ?? "The cost breakdown"}\nSlide 6: Save this for your next upgrade 🔖\n\nCaption: I put way too many hours into this so you don't have to. ${pts[0]}. Which slide surprised you most? 👇\n\n#${i.creator.niches[0] ?? "creator"} #deskSetup #creatorLife`,
        });
        break;
      case "x":
        out.push({
          platform: p,
          format: "Thread",
          content: [`1/ ${title}. Here's what I learned (the short version) 🧵`, ...pts.map((pt, k) => `${k + 2}/ ${pt}.`), `${pts.length + 2}/ If this was useful, the full breakdown is in my newsletter. Link in bio.`].join("\n\n"),
        });
        break;
      case "linkedin":
        out.push({
          platform: p,
          format: "Post",
          content: `${pts[0]}.\n\nI didn't expect that.\n\nHere's what happened when I ${title.toLowerCase().replace(/^(i |my )/, "")}:\n\n→ ${pts[1] ?? "The obvious fix wasn't the right one"}\n→ ${pts[2] ?? "The cheap option won"}\n→ ${pts[3] ?? "Consistency beat intensity"}\n\nThe lesson for anyone building something: the details you skip are usually the ones that compound.\n\nWhat's a small change that made a big difference for you?`,
        });
        break;
      case "newsletter":
        out.push({
          platform: p,
          format: "Newsletter section",
          content: `Subject: ${title} (the honest version)\nPreview: ${pts[0]}\n\nHey friend,\n\nThis week I went deep on something I've been putting off. Three things stood out:\n\n• ${pts[0]}\n• ${pts[1] ?? "The price didn't matter as much as I thought"}\n• ${pts[2] ?? "I'd do it again — with one change"}\n\nThe full video is live if you want the details. Hit reply and tell me what you'd test next — I read every one.\n\n— ${first(i.creator.name)}`,
        });
        break;
      default:
        out.push({ platform: p, format: "Post", content: `${title}\n\n${pts.map((x) => `• ${x}`).join("\n")}` });
    }
  }
  return { outputs: out };
}

/* ---------------------------------- Emails --------------------------------- */

const PLATFORM_NAMES: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", x: "X", linkedin: "LinkedIn", newsletter: "newsletter", twitch: "Twitch", podcast: "podcast" };
const pname = (p: string) => PLATFORM_NAMES[p] ?? p;

/** Fit reasons are written to the creator ("your audience…"); pitches need first person ("my audience…"). */
function firstPerson(s: string) {
  return s
    .replace(/\bYou're\b/g, "I'm")
    .replace(/\byou're\b/g, "I'm")
    .replace(/\bYour\b/g, "My")
    .replace(/\byour\b/g, "my")
    .replace(/\bYou've\b/g, "I've")
    .replace(/\byou've\b/g, "I've")
    .replace(/\bYou\b/g, "I")
    .replace(/\byou\b/g, "me");
}

function topStat(c: CreatorBrief) {
  const yt = c.platforms.find((p) => p.platform === "youtube") ?? c.platforms[0];
  return yt;
}

export function localPitch(i: PitchInput): EmailOut {
  const yt = topStat(i.creator);
  const opener =
    i.tone === "bold"
      ? `I'll be direct: I think I'm the best fit you'll get for ${i.campaign}.`
      : i.tone === "concise"
        ? `Quick pitch for ${i.campaign}.`
        : `I've had ${i.brand} on my wishlist for a while, so “${i.campaign}” jumped out immediately.`;
  const reasons = i.fitReasons.slice(0, 2).map((x) => `• ${firstPerson(x)}`).join("\n");
  const concept = `My concept: a no-script, honest-review format — I live with the product for two weeks, then show my audience the one moment it genuinely changed my day (and one thing I'd improve). It's the format behind my best-performing videos.`;
  const body = `Hi ${i.manager},\n\n${opener}\n\nWhy it works:\n${reasons}\n• ${fmt(yt.avgViews)} average views on ${pname(yt.platform)} with ${(yt.engagement * 100).toFixed(1)}% engagement\n\n${concept}\n\nScope: ${i.deliverables.join(", ")}.\nRate: ${usd(i.amount)}, Net-15, 30-day organic usage (paid usage licensed separately).\n\nIf that works, I can send a one-line concept for approval this week.\n\nBest,\n${first(i.creator.name)}\n@${i.creator.handle}`;
  return { subject: `${first(i.creator.name)} × ${i.brand} — ${i.campaign}`, body };
}

export function localReminder(i: ReminderInput): EmailOut {
  const c = first(i.contact);
  const me = first(i.creator.name);
  if (i.remindersSent === 0)
    return {
      subject: `Friendly nudge: invoice ${i.invoiceNumber}`,
      body: `Hi ${c},\n\nHope you're well! Just a quick nudge on invoice ${i.invoiceNumber} for ${usd(i.amount)}, which was due on ${i.dueDate}. Could you check where it is in your AP queue? Happy to resend it or fill in any vendor forms if that helps.\n\nThanks so much — loved working on this one.\n\n${me}`,
    };
  if (i.remindersSent === 1)
    return {
      subject: `Second reminder: invoice ${i.invoiceNumber} (${i.daysOverdue} days overdue)`,
      body: `Hi ${c},\n\nFollowing up on invoice ${i.invoiceNumber} for ${usd(i.amount)}, now ${i.daysOverdue} days past the ${i.dueDate} due date. Per our agreement, late payments accrue ${i.lateFeePct}% per month, which I'd prefer not to apply.\n\nCould you confirm a payment date by end of week?\n\nThank you,\n${me}`,
    };
  return {
    subject: `Final notice: invoice ${i.invoiceNumber}`,
    body: `Hi ${c},\n\nThis is a final notice for invoice ${i.invoiceNumber} (${usd(i.amount)}), now ${i.daysOverdue} days overdue. A ${i.lateFeePct}% monthly late fee now applies as per our contract. If payment isn't scheduled within 5 business days, I'll need to escalate.\n\nI'd really rather resolve this together — please let me know the status today.\n\n${me}`,
  };
}

export function localCounter(i: CounterInput): EmailOut {
  const yt = topStat(i.creator);
  return {
    subject: `Re: ${i.campaign} — proposal`,
    body: `Hi ${first(i.contact)},\n\nThank you for the offer — I'm genuinely excited about ${i.brand} and want to make this work.\n\nBased on my current numbers (${fmt(yt.avgViews)} average views, ${(yt.engagement * 100).toFixed(1)}% engagement) and the scope, my rate for this package is ${usd(i.counter)} rather than ${usd(i.offer)}.${
      i.reasons.length ? `\n\nFor context:\n${i.reasons.map((x) => `• ${x}`).join("\n")}` : ""
    }${i.termChanges.length ? `\n\nA few small contract changes I'd need:\n${i.termChanges.map((x) => `• ${x}`).join("\n")}` : ""}\n\nIf the budget is fixed, I'm happy to adjust scope instead — e.g. drop one Short and keep the main integration.\n\nLooking forward to it,\n${first(i.creator.name)}`,
  };
}

/* ---------------------------------- Replies -------------------------------- */

export function localReplies(i: ReplyInput): RepliesOut {
  const them = first(i.name);
  const last = [...i.messages].reverse().find((m) => m.from === "them")?.text ?? "";
  const me = first(i.creator.name);
  switch (i.category) {
    case "deal": {
      if (/contract|sign/i.test(last))
        return {
          replies: [
            { label: "Request changes", text: `Hi ${them},\n\nThanks for sending this over! I've reviewed it and need a few changes before signing: Net-15 payment terms, usage limited to 30 days organic (paid usage licensed separately), exclusivity narrowed to direct competitors for 30 days, and a 50% kill fee. Happy to jump on a quick call to finalize.\n\nBest,\n${me}` },
            { label: "Ask for more time", text: `Hi ${them},\n\nThanks! I always run agreements past my review process — I'll have notes back to you within 48 hours. If Friday is a hard deadline, let me know and I'll prioritize it.\n\n${me}` },
            { label: "Decline politely", text: `Hi ${them},\n\nThank you for the opportunity. Unfortunately the usage and exclusivity terms don't work for me right now, so I'll have to pass on this one. I'd love to collaborate in the future under different terms.\n\nBest,\n${me}` },
          ],
        };
      const rate = i.rateHint ? usd(i.rateHint) : "my standard rate";
      return {
        replies: [
          { label: "Share rate card", text: `Hi ${them},\n\nThanks so much for reaching out — love what you're building! For a 60-second integration my rate is ${rate}, and for a package of 3 I offer 10% off. That includes 30 days of organic usage; paid usage is licensed separately. I have availability from mid-October.\n\nWant me to send my media kit and a couple of concept ideas?\n\nBest,\n${me}` },
          { label: "Ask scope & budget", text: `Hi ${them},\n\nThanks for thinking of me! Before I quote, could you share a bit more: the deliverables you have in mind, timeline, usage rights, and any exclusivity? Happy to tailor a package to your budget.\n\nBest,\n${me}` },
          { label: "Not a fit", text: `Hi ${them},\n\nReally appreciate you reaching out. This one isn't quite the right fit for my audience right now, but I'd love to stay in touch for future campaigns.\n\nAll the best,\n${me}` },
        ],
      };
    }
    case "collab":
      return {
        replies: [
          { label: "I'm in!", text: `${them}!! I love this idea 😄 let's do it. Want to hop on a quick call this week to map it out? I'm free Thu or Fri afternoon.` },
          { label: "Suggest a twist", text: `Ooh I like it! What if we each get a $200 budget to upgrade the other's setup too? More stakes = more fun. Down to brainstorm?` },
          { label: "Maybe later", text: `This sounds so fun — my next few weeks are packed with launches, but can we revisit in November? I'd love to make it happen properly.` },
        ],
      };
    case "fan":
      if (/what|which|where|\?/i.test(last))
        return {
          replies: [
            { label: "Answer + link", text: `Thank you!! It's the Halo Glow light bar — I've linked it (and everything else on my desk) in the description 🙌` },
            { label: "Answer + tease", text: `Haha thank you! It's in my full gear list — and I'm doing a whole video on lighting next week 👀` },
            { label: "Heart reply", text: `This made my day, thank you 🫶` },
          ],
        };
      return {
        replies: [
          { label: "Thoughtful reply", text: `Thank you for this message, it genuinely means a lot. Honestly? I was scared too. I went part-time first, saved 6 months of expenses, and only jumped once brand deals covered rent. You've got this — and I'm going to write a whole newsletter on this.` },
          { label: "Short & warm", text: `Thank you so much 🥹 Short answer: I wasn't sure, I just made a plan. Longer answer coming in my newsletter this week!` },
          { label: "Point to resource", text: `I get this question a lot, so I put everything into one video — it's pinned on my profile. Hope it helps! 💛` },
        ],
      };
    case "spam":
      return {
        replies: [
          { label: "Don't reply", text: "No reply recommended. This matches known 'ambassador' scam patterns — reporting and blocking keeps your account safe." },
          { label: "Report note", text: "Reported as spam: requests payment and card details for a 'free' product." },
          { label: "Firm decline", text: "No thanks — I don't pay for brand partnerships." },
        ],
      };
    default:
      return {
        replies: [
          { label: "Follow up", text: `Hi ${them},\n\nJust following up on this — could you share an update when you have a moment?\n\nThanks,\n${me}` },
          { label: "Confirm", text: `Thanks ${them}, confirmed on my side!` },
          { label: "Ask for date", text: `Hi ${them}, could you confirm the expected date for this? It helps me plan. Thanks!` },
        ],
      };
  }
}

/* --------------------------------- Contract -------------------------------- */

export function localContract(i: ContractInput): ContractOut {
  const s = scanContract(i.text);
  return { score: s.score, summary: s.summary, flags: s.flags };
}

/* ----------------------------------- Bio ----------------------------------- */

export function localBio(i: BioInput): BioOut {
  const total = i.creator.platforms.reduce((s, p) => s + p.followers, 0);
  const yt = topStat(i.creator);
  return {
    bio: `${i.creator.name} is a ${i.creator.niches.join(" & ")} creator reaching ${(total / 1_000_000).toFixed(1)}M people across ${i.creator.platforms.length} platforms, known for honest, data-backed reviews and desk-setup tours that audiences actually buy from. ${pname(yt.platform)} videos on @${i.creator.handle} average ${fmt(yt.avgViews)} views with ${(yt.engagement * 100).toFixed(1)}% engagement — well above the category average — from a ${i.audience} audience. Partnerships perform best with real time on the product and creative control over the story.`,
  };
}

/* --------------------------------- Copilot --------------------------------- */

function bullet(lines: string[]) {
  return lines.map((l) => `- ${l}`).join("\n");
}

export function localChat(question: string, ctx: CopilotContext): string {
  const q = question.toLowerCase();
  const name = first(ctx.creator.name);
  const owed = ctx.deals.filter((d) => d.invoice && d.invoice.status !== "paid");
  const overdue = owed.filter((d) => d.invoice!.status === "overdue");

  if (/(project|footage|clip|\bcuts?\b|export|pipeline)/.test(q) && ctx.projects) {
    const ps = ctx.projects;
    if (!ps.length) return "You don't have any video projects yet. Open **Projects → New project**, add a script and some footage, and the clip agent will propose short-form cuts you can edit and export.";
    const waiting = ps.filter((p) => p.reviewWaiting);
    return `Here's where your video projects stand:

${bullet(ps.map((p) => `**${p.title}** — ${p.stage} · ${p.footageMin.toFixed(1)} min of footage · ${p.cuts} cut${p.cuts === 1 ? "" : "s"} · ${p.exports} export${p.exports === 1 ? "" : "s"}`))}

${waiting.length ? `**Next step:** the clip agent is waiting on you in **${waiting[0].title}** — approve its cuts or ask for a revision.` : ps.some((p) => p.stage === "Ready to cut") ? "**Next step:** run the clip agent on a project that has footage but no cuts yet." : "**Next step:** export your best cut and schedule it from the Deliver tab."}`;
  }

  if (/(booking|book|package|instant)/.test(q)) {
    const reqs = ctx.bookingRequests ?? [];
    const pk = ctx.packages ?? [];
    return `${reqs.length ? `You have **${reqs.length} booking request${reqs.length > 1 ? "s" : ""}** waiting:\n\n${bullet(reqs.map((b) => `**${b.brand}** wants *${b.package}* for **${usd(b.price)}** — respond within **${b.hoursLeft}h**`))}\n\n` : "No booking requests are waiting right now.\n\n"}Your bookable packages:\n\n${bullet(pk.map((p) => `${p.title} — **${usd(p.price)}**${p.instantBook ? " · Instant Book" : ""} · ${p.booked}`))}\n\n**Tip:** brands pay up front into CreatorCover when they book, so accepted bookings can't turn into late invoices.`;
  }

  if (/(feedback|review|revision|draft|notes|scope)/.test(q)) {
    const rv = ctx.reviews ?? [];
    if (!rv.length) return "No drafts are waiting on feedback right now.";
    return rv
      .map(
        (r) =>
          `**${r.brand}** — ${r.status}, revision round ${r.roundsUsed} of ${r.roundsIncluded} used.\n\n${bullet(r.openComments.map((c) => (c.includes("OUT OF SCOPE") ? `**${c.replace(" (OUT OF SCOPE)", "")}** — *outside your agreement: offer it as a paid add-on*` : c)))}`,
      )
      .join("\n\n")
      .concat("\n\n**Next step:** open the deal's **Review** tab — I've drafted a reply that accepts the in-scope notes and quotes the extra.");
  }

  if (/(owe|owed|invoice|paid|payment|money|cash)/.test(q)) {
    const total = owed.reduce((s, d) => s + d.value, 0);
    if (!owed.length) return `Good news — nobody owes you money right now. Every invoice is **paid**. 🎉`;
    return `You have **${usd(total)}** outstanding across ${owed.length} invoice${owed.length > 1 ? "s" : ""}:\n\n${bullet(
      owed.map((d) => `**${d.brand}** — ${usd(d.value)} (${d.invoice!.number}), ${d.invoice!.status === "overdue" ? `**overdue** since ${d.invoice!.due}` : `due ${d.invoice!.due}`}`),
    )}\n\n${overdue.length ? `**Next step:** ${overdue[0].brand} is overdue. I've drafted a friendly reminder — open **Earnings → Invoices** to review and send it.` : "Nothing is overdue yet — I'll nudge you the day anything slips."}`;
  }

  if (/(contract|sign|terms|halcyon|clause)/.test(q)) {
    const risky = ctx.deals.find((d) => d.contractRisk);
    if (risky)
      return `**Don't sign the ${risky.brand} contract yet.** ${risky.contractRisk}\n\nThe big ones:\n${bullet([
        "**Perpetual, all-media usage** with no extra pay — they could run your face in ads forever",
        "**Net-90, pay-when-paid** — you'd carry their client's payment risk",
        "**90-day exclusivity on all consumer electronics** — this conflicts with your Lumen and Orbit deals",
        "**No kill fee** — they can cancel after you've filmed and owe you nothing",
      ])}\n\n**Next step:** open the deal in **Deals** → *Contract* tab. I've written the redlines; one click sends a counter.`;
    return "Paste any contract into a deal's **Contract** tab and I'll flag risky clauses (payment terms, usage rights, exclusivity, kill fees) with suggested redlines.";
  }

  if (/(charge|rate|price|worth|quote|ask for)/.test(q)) {
    const yt = topStat(ctx.creator);
    const integ = Math.round(((yt.avgViews / 1000) * 26 * 1.1) / 50) * 50;
    return `Based on your **${fmt(yt.avgViews)} average views** and **${(yt.engagement * 100).toFixed(1)}% engagement** (well above the ~4% category average), here's your fair-rate card:\n\n${bullet([
      `YouTube integration (60–90s): **${usd(integ)}**`,
      `Dedicated YouTube video: **${usd(integ * 1.9)}**`,
      `YouTube Short / TikTok: **${usd(integ * 0.35)}**`,
      `Instagram Reel: **${usd(integ * 0.25)}**`,
      `Paid usage: **+30% per 30 days** · Exclusivity: **+5–28%**`,
    ])}\n\n**Tip:** brands expect a counter. Quote ~10% above your target so you land on it.`;
  }

  if (/(burn|tired|exhaust|overwork|rest|break|too much|balance|wellbeing)/.test(q)) {
    const w = ctx.workload;
    const pct = Math.round((w.hours / w.capacity) * 100);
    return `You've planned **${w.hours.toFixed(1)} hours** over the next 7 days — **${pct}%** of your ${w.capacity}h capacity (${w.status}).${w.busiestDay ? ` Your heaviest day is **${w.busiestDay}**.` : ""}\n\n${
      pct > 90
        ? bullet([
            "Move the *Why I quit ultrawide monitors* video to next week — it's not tied to a deal",
            "Batch-film both Lumen Shorts in the same session as the main integration",
            `Protect at least **2 rest days** — you have ${w.restDays} right now`,
          ])
        : bullet([
            `You have **${w.restDays} light days** this week — keep at least one fully offline`,
            "You're on track: no deadline collisions in the next 7 days",
            "Batch tomorrow's newsletter with Thursday's thread to save ~1 hour",
          ])
    }\n\nSustainable beats viral. Want me to rebalance your calendar?`;
  }

  if (/(idea|post|video|content|make|film|create)/.test(q)) {
    const ideas = localIdeas({ creator: ctx.creator, prompt: "", platform: "any", recent: ctx.upcoming.map((u) => u.title) }).ideas.slice(0, 3);
    return `Three ideas I'd make this week, ${name}:\n\n${ideas.map((x, k) => `${k + 1}. **${x.title}** (${x.format})\n   *Hook:* "${x.hook}"\n   ${x.why}`).join("\n\n")}\n\n**Next step:** open **Create** to turn any of these into a full script in one click.`;
  }

  if (/(week|today|plate|due|deadline|todo|to-do|schedule|upcoming|focus|priorit)/.test(q)) {
    const dueSoon = ctx.deals.filter((d) => ["production", "contracted"].includes(d.stage)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return `Here's what matters this week:\n\n${bullet([
      ...dueSoon.slice(0, 2).map((d) => `**${d.brand}** — ${d.campaign} due **${d.dueDate}**`),
      ...overdue.map((d) => `**Chase ${d.brand}** — ${usd(d.value)} invoice overdue`),
      ...ctx.unreadInbox.filter((m) => m.category === "Brand deal").slice(0, 2).map((m) => `**Reply to ${m.name}** — ${m.summary}`),
      `${ctx.upcoming.length} posts scheduled · ${ctx.workload.hours.toFixed(0)}h planned of ${ctx.workload.capacity}h`,
    ])}\n\n**If you only do one thing today:** send the Lumen draft — it unlocks a ${usd(ctx.deals.find((d) => d.brand === "Lumen Audio")?.value ?? 4800)} payment.`;
  }

  if (/(grow|follower|insight|analytics|best time|perform|views|algorithm)/.test(q)) {
    return `Quick read on your growth:\n\n${bullet([
      "**TikTok** is your fastest-growing platform (+5.2% in 30 days)",
      "Your *Monitor arm install in 60 seconds* Short hit **14.6× your average** — 61% of views came from the UK & Germany",
      "Best time to post: **Wednesday 6–9pm** (your audience's peak engagement)",
      "Numbered carousels get **3.4× more saves** than Reels on Instagram",
    ])}\n\n**Next step:** make a part 2 of the monitor-arm Short within 72 hours while the audience is warm.`;
  }

  if (/(earn|income|revenue|made|month|year|diversif|tax)/.test(q)) {
    return `You've earned **${usd(ctx.earnings.ytd)}** over the last 12 months. This month so far: **${usd(ctx.earnings.thisMonth)}** (last month: ${usd(ctx.earnings.lastMonth)}).\n\n${bullet([
      `**${ctx.earnings.topStream}** is ${Math.round(ctx.earnings.topStreamShare * 100)}% of income — anything over 50% is a concentration risk`,
      `Set aside ~**${usd(ctx.earnings.thisMonth * 0.28)}** for taxes from this month`,
      "Memberships grew every month this year — your most stable stream",
    ])}`;
  }

  return `Hey ${name}! I can see your deals, calendar, inbox and earnings. Try asking me:\n\n${bullet([
    "*How much am I owed right now?*",
    "*What should I focus on this week?*",
    "*Should I sign the Halcyon contract?*",
    "*What should I charge for a YouTube integration?*",
    "*Give me 3 video ideas*",
    "*Am I overworking?*",
  ])}`;
}
