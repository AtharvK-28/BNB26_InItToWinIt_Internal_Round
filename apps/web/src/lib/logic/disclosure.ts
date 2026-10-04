/**
 * Sponsored-post disclosure check, based on the FTC's "Disclosures 101 for Social Media
 * Influencers": disclose clearly, put it where people will see it (not after "more"),
 * avoid vague tags like #sp / #spon / #collab, and in video say it and show it.
 * Guidance only — not legal advice.
 */

export interface DisclosureIssue {
  level: "fail" | "warn" | "pass";
  text: string;
}

export interface DisclosureResult {
  ok: boolean;
  issues: DisclosureIssue[];
  fixed: string;
}

const CLEAR = /(#ad\b|#advertisement\b|#sponsored\b|\bsponsored\b|\bpaid partnership\b|\badvertisement\b|\bad:)/i;
const VAGUE = /(#sp\b|#spon\b|#collab\b|#partner\b|#ambassador\b|#thanks\w*)/i;
const VISIBLE_CHARS = 125; // roughly what shows before "… more" on Instagram

export function checkDisclosure(caption: string, opts: { brand?: string; video?: boolean } = {}): DisclosureResult {
  const issues: DisclosureIssue[] = [];
  const text = caption.trim();
  const clear = text.match(CLEAR);
  const vague = text.match(VAGUE);

  if (!clear) {
    issues.push({ level: "fail", text: "No clear disclosure. Add “#ad”, “Sponsored” or “Paid partnership with …”." });
  } else if ((clear.index ?? 0) > VISIBLE_CHARS) {
    issues.push({ level: "fail", text: "The disclosure is hidden after “… more”. Move it to the start of the caption." });
  } else {
    issues.push({ level: "pass", text: `Clear disclosure (“${clear[0]}”) where people will see it.` });
  }
  if (vague) issues.push({ level: clear ? "warn" : "fail", text: `“${vague[0]}” is too vague on its own — the FTC calls out tags like #sp, #spon and #collab.` });
  if (opts.video) issues.push({ level: "warn", text: "In the video itself, say it out loud and show it on screen — a description-only disclosure isn't enough." });
  const brandWord = opts.brand?.split(" ")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (opts.brand && brandWord && !new RegExp(brandWord, "i").test(text)) issues.push({ level: "warn", text: `Name the brand (${opts.brand}) so the relationship is obvious.` });

  const stripped = text.replace(new RegExp(VAGUE.source, "gi"), "").replace(/\s{2,}/g, " ").trim();
  const prefix = opts.brand ? `#ad · Paid partnership with ${opts.brand}. ` : "#ad ";
  const fixed = clear && (clear.index ?? 0) <= VISIBLE_CHARS && !vague ? text : `${prefix}${stripped.replace(CLEAR, "").trim()}`;
  return { ok: !issues.some((i) => i.level === "fail"), issues, fixed };
}
