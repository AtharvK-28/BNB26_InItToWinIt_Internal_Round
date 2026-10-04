import type { ContractFlag, ContractScan } from "../types";

/**
 * Rule-based contract scanner — the offline fallback for the Claude-powered review.
 * Each rule targets a clause creator lawyers repeatedly warn about.
 */

const WORD_NUM: Record<string, number> = {
  seven: 7, fourteen: 14, fifteen: 15, thirty: 30, "forty-five": 45, fortyfive: 45, sixty: 60, ninety: 90, "one hundred twenty": 120,
};

function sentenceAround(text: string, idx: number) {
  const start = Math.max(text.lastIndexOf(".", idx - 1) + 1, text.lastIndexOf("\n", idx - 1) + 1, 0);
  let end = text.indexOf(".", idx);
  if (end === -1) end = text.length;
  return text.slice(start, end + 1).trim().replace(/\s+/g, " ");
}

function parseDays(s: string) {
  const digit = s.match(/\((\d+)\)|(\d+)/);
  if (digit) return Number(digit[1] ?? digit[2]);
  const w = Object.keys(WORD_NUM).find((k) => s.toLowerCase().includes(k));
  return w ? WORD_NUM[w] : undefined;
}

interface Rule {
  test: RegExp;
  build: (m: RegExpMatchArray, text: string) => ContractFlag | null;
}

const RULES: Rule[] = [
  {
    test: /net\s+([a-z\- ]+?\(?\d*\)?)\s*days?/i,
    build: (m, text) => {
      const days = parseDays(m[1]) ?? 30;
      if (days <= 30) return null;
      return {
        severity: days >= 60 ? "high" : "medium",
        title: `Net-${days} payment terms`,
        clause: sentenceAround(text, m.index ?? 0),
        issue: `You'd wait ${days}+ days after invoicing — plus approval time, that can mean ${Math.round((days + 20) / 7)} weeks without pay.`,
        suggestion: "Counter with Net-15 (Net-30 max) and a 50% deposit on signing.",
      };
    },
  },
  {
    test: /(receives? payment (approval )?from its client|upon receipt of (payment|funds) from|paid by (its|the) client|pay[- ]when[- ]paid)/i,
    build: (m, text) => ({
      severity: "high",
      title: "Pay-when-paid clause",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "Your payment depends on a third party paying the brand — you take on their collection risk with no contract with that client.",
      suggestion: "Strike it: payment should be due a fixed number of days from your invoice, regardless of client payments.",
    }),
  },
  {
    test: /(perpetual|in perpetuity|irrevocable)/i,
    build: (m, text) => ({
      severity: "high",
      title: "Perpetual usage rights",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "The brand could use your face and content forever — including in ads — without paying again.",
      suggestion: "Limit to 30 days organic. License paid usage separately (typically +30–50% per 30 days).",
    }),
  },
  {
    test: /(paid advertising|paid media|whitelisting|boost)[^.]*without additional compensation|without additional compensation[^.]*(paid|advertis)/i,
    build: (m, text) => ({
      severity: "high",
      title: "Free paid-ad usage",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "Paid usage turns your content into an ad campaign. It's a separate, billable license.",
      suggestion: "Add: 'Paid usage requires a separate written agreement and fee.'",
    }),
  },
  {
    test: /not (promote|work with|partner with)[^.]*?for\s+([a-z\- ]+?\(?\d*\)?)\s*days/i,
    build: (m, text) => {
      const days = parseDays(m[2]) ?? 30;
      const broad = /all|any/i.test(sentenceAround(text, m.index ?? 0)) || /consumer electronics/i.test(m[0]);
      if (days <= 30 && !broad) return null;
      return {
        severity: days >= 60 || broad ? "high" : "medium",
        title: `${days}-day ${broad ? "broad " : ""}exclusivity`,
        clause: sentenceAround(text, m.index ?? 0),
        issue: broad
          ? "This blocks a whole category of brands — likely conflicting with deals you already have."
          : "Long exclusivity costs you other deals during that window.",
        suggestion: `Narrow to direct competitors only, for 14–30 days — or charge +${days >= 60 ? "25" : "10"}% for exclusivity.`,
      };
    },
  },
  {
    test: /unlimited (revisions|edits|changes)/i,
    build: (m, text) => ({
      severity: "medium",
      title: "Unlimited revisions",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "Unlimited revisions means unlimited unpaid work.",
      suggestion: "Cap at 2 rounds of reasonable revisions; extra rounds billed at a day rate.",
    }),
  },
  {
    test: /terminate[^.]*(for any reason|at any time)[^.]*without (payment|compensation)/i,
    build: (m, text) => ({
      severity: "high",
      title: "Cancel without paying",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "The brand can walk away after you've done the work and owe you nothing.",
      suggestion: "Add a kill fee: 50% after concept approval, 100% after filming.",
    }),
  },
  {
    test: /sole discretion/i,
    build: (m, text) => ({
      severity: "medium",
      title: "Vague morality clause",
      clause: sentenceAround(text, m.index ?? 0),
      issue: "'Sole discretion' lets the brand withhold payment for almost any reason.",
      suggestion: "Define specific conduct, and keep payment for work already delivered.",
    }),
  },
];

export function scanContract(text: string): ContractScan {
  const flags: ContractFlag[] = [];
  for (const rule of RULES) {
    const m = text.match(rule.test);
    if (m) {
      const f = rule.build(m, text);
      if (f) flags.push(f);
    }
  }
  if (!/late (fee|payment|interest)|interest at/i.test(text)) {
    flags.push({
      severity: "low",
      title: "No late-payment fee",
      clause: "—",
      issue: "Without a late fee, there's no cost to the brand for paying late.",
      suggestion: "Add: 'Late payments accrue 1.5% interest per month.'",
    });
  }
  if (!/kill fee|cancellation fee|cancels? after/i.test(text) && !flags.some((f) => f.title === "Cancel without paying")) {
    flags.push({
      severity: "medium",
      title: "No kill fee",
      clause: "—",
      issue: "If the brand cancels mid-project you have no protection.",
      suggestion: "Add a 50% kill fee after concept approval.",
    });
  }
  const order = { high: 0, medium: 1, low: 2 } as const;
  flags.sort((a, b) => order[a.severity] - order[b.severity]);
  const penalty = flags.reduce((s, f) => s + (f.severity === "high" ? 18 : f.severity === "medium" ? 9 : 3), 0);
  const score = Math.max(6, Math.min(98, 100 - penalty));
  const highs = flags.filter((f) => f.severity === "high").length;
  const summary =
    highs >= 2
      ? `Don't sign yet. ${highs} high-risk clauses put your payment and your content at risk. Counter with the edits below — they're standard asks for creator agreements.`
      : highs === 1
        ? "Mostly fine, but one clause needs to change before you sign."
        : flags.length
          ? "Creator-friendly overall. A couple of small additions would make it airtight."
          : "This contract looks creator-friendly. Clear terms, fair usage, and you're protected if things change.";
  return { score, summary, flags, source: "local" };
}
