/**
 * Local engine for production writing: per-format post copy for a cut, and the Story
 * draft (hooks, script, caption, titles) used when the pipeline has no Gemini key.
 * Deterministic and built only from the creator's own words, like the Claude prompts.
 */
import type { CopyInput, CopyOut, CreatorBrief, Format, StoryInput, StoryOut } from "./schemas";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function sentences(text: string) {
  return text
    .split("\n")
    .filter((line) => !/^\s*#/.test(line)) // markdown headings are labels, not lines to say
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => clean(s).replace(/^[-•*\d.)\s]+/, ""))
    .filter((s) => s.split(" ").length >= 4)
    .map((s) => (/[.!?…]$/.test(s) ? s : `${s}.`));
}

function clip(s: string, max: number) {
  const t = clean(s);
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s\S*$/, "") + "…";
}

function tags(c: CreatorBrief, title: string, count: number, extra: string[] = []) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 4)
    .slice(0, 3);
  const all = [...extra, ...c.niches.map((n) => n.replace(/\s+/g, "")), ...words];
  return [...new Set(all)]
    .slice(0, count)
    .map((t) => `#${t}`)
    .join(" ");
}

export function localCopy(i: CopyInput): CopyOut {
  const title = clean(i.title) || "New video";
  const said = sentences(i.spoken);
  const hook = clean(i.hook) || title;
  // The strongest line that isn't just the title again: what's said, else the caption, else the hook.
  const point = [said[0], clean(i.caption), hook].find((s) => s && s.toLowerCase() !== title.toLowerCase()) ?? "";
  const lines = (...parts: string[]) => parts.filter(Boolean).join("\n");
  const write: Record<Format, () => string> = {
    youtube_shorts: () => lines(clip(title, 95), clip(point, 140), "", tags(i.creator, title, 3, ["Shorts"])),
    instagram_reel: () => lines(clip(hook, 120), point !== hook ? clip(point, 160) : "", said[1] ? clip(said[1], 160) : "", "Would you try this? Tell me below 👇") + `\n\n${tags(i.creator, title, 7, ["reels"])}`,
    tiktok: () => `${clip(hook, 110)} 👀 ${tags(i.creator, title, 4, ["fyp"])}`,
    youtube_video: () =>
      lines(point ? `${title}. ${clip(point, 180)}` : title, said.length ? `\nIn this video:\n${said.slice(0, 3).map((s) => `• ${clip(s, 90)}`).join("\n")}` : "", "", tags(i.creator, title, 3)),
    square_post: () => clip([point || title, said[1] ? clip(said[1], 120) : ""].filter(Boolean).join(" "), 250) + ` ${tags(i.creator, title, 2)}`,
  };
  return { captions: i.formats.map((format) => ({ format, caption: write[format]().slice(0, 2200) })) };
}

const CTA: Record<string, string> = {
  youtube: "Subscribe for the follow-up — I'll show what I changed next.",
  instagram: "Save this for later and tell me which part you'd try first.",
  tiktok: "Follow for part two.",
  linkedin: "Curious how others handle this — what's worked for you?",
  x: "Reply with your version — I read every one.",
};

export function localStory(i: StoryInput): StoryOut {
  const title = clean(i.title) || "My next video";
  const topic = title
    .replace(/^(i |my |the |why |how )/i, "")
    .replace(/[.?!]+$/, "")
    .replace(/\s+(19|20)\d\d$/, ""); // "Minimal desk tour 2026" → "Minimal desk tour"
  const lines = sentences(i.brief);
  const number = i.brief.match(/\$?\d[\d,.]*%?/)?.[0];
  const hooks = [
    { angle: "Straight to the result", text: clip(lines[0] ?? `${title}. Here's what actually happened.`, 180) },
    { angle: "Curiosity gap", text: `Nobody warned me about this part of ${topic.toLowerCase()} — so here's the honest version.` },
    number
      ? { angle: "Specific number", text: clip(`${number} — that's the number that changed how I think about ${topic.toLowerCase()}.`, 180) }
      : { angle: "Contrarian", text: `Everything you've heard about ${topic.toLowerCase()} skips the part that matters.` },
  ];
  const body = lines.length ? lines : [`This one is about ${topic.toLowerCase()}`, "Here's the setup and why it matters to you", "Then the part that surprised me", "And what I'd do differently next time"];
  const cta = CTA[i.platforms[0]] ?? CTA.youtube;
  const script = [
    hooks[0].text,
    body.slice(1, 3).join(" ") || body[0],
    body.slice(3, 6).join(" "),
    body.length > 6 ? body.slice(6, 9).join(" ") : "",
    i.direction ? `(${clip(i.direction, 160)})` : "",
    `So that's ${topic.toLowerCase()}, without the fluff. ${cta}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const caption = `${clip(lines[0] ?? title, 220)} ${cta}\n\n${tags(i.creator, title, 4)}`;
  const titles = [clip(title, 70), clip(`${topic}: the honest version`, 70), clip(`What ${topic.toLowerCase()} taught me`, 70)];
  return { hooks, script, caption, titles: [...new Set(titles)].slice(0, 3) };
}
