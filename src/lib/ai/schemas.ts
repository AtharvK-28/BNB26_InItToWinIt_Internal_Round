import { z } from "zod";

/**
 * Output schemas for every AI task. Claude's structured outputs are constrained to these,
 * and the local fallbacks return the same shapes, so the UI never cares which one answered.
 */

export const PlatformEnum = z.enum(["youtube", "tiktok", "instagram", "x", "linkedin", "newsletter", "twitch", "podcast"]);

export const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string().describe("Working title, under 70 characters"),
      hook: z.string().describe("The first spoken line — must stop the scroll"),
      platform: PlatformEnum,
      format: z.string().describe("e.g. Long video, Short, Reel, Carousel, Thread, Post, Newsletter"),
      why: z.string().describe("One sentence on why this will work for this creator's audience right now"),
      score: z.number().describe("Predicted performance 0-100"),
      effort: z.number().describe("Estimated production hours"),
    }),
  ),
});

export const ScriptSchema = z.object({
  title: z.string(),
  hook: z.string(),
  sections: z.array(
    z.object({
      heading: z.string().describe("Section name with an approximate timestamp, e.g. 'Setup (0:05–0:40)'"),
      beats: z.array(z.string()),
      broll: z.string().describe("B-roll or on-screen text suggestion"),
    }),
  ),
  cta: z.string(),
  thumbnailIdeas: z.array(z.string()),
});

export const RepurposeSchema = z.object({
  outputs: z.array(
    z.object({
      platform: PlatformEnum,
      format: z.string(),
      content: z.string().describe("Ready-to-post copy. Use line breaks. For carousels, prefix slides with 'Slide N:'. For threads, number posts '1/'."),
    }),
  ),
});

export const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const RepliesSchema = z.object({
  replies: z.array(
    z.object({
      label: z.string().describe("2-4 word label for the reply option"),
      text: z.string(),
    }),
  ),
});

export const ContractSchema = z.object({
  score: z.number().describe("0-100 creator-friendliness; 100 = ideal for the creator"),
  summary: z.string().describe("Two sentences, plain English, with a clear sign / don't sign recommendation"),
  flags: z.array(
    z.object({
      severity: z.enum(["high", "medium", "low"]),
      title: z.string().describe("Short name of the issue"),
      clause: z.string().describe("The exact clause text, quoted from the contract, or '—' if the issue is something missing"),
      issue: z.string().describe("Why it matters for the creator, one sentence"),
      suggestion: z.string().describe("Concrete redline or counter-proposal"),
    }),
  ),
});

export const BioSchema = z.object({ bio: z.string() });

export const TitlesSchema = z.object({
  variants: z.array(
    z.object({
      title: z.string().describe("YouTube title, ideally 40-65 characters"),
      thumbnailText: z.string().describe("2-4 words of thumbnail text that complements (not repeats) the title"),
      angle: z.string().describe("One or two words naming the psychological angle, e.g. Curiosity, Contrarian, Challenge"),
      score: z.number().describe("Predicted click appeal 0-100"),
      why: z.string().describe("One sentence on why it should work for this audience"),
    }),
  ),
});

export const ClipsSchema = z.object({
  clips: z.array(
    z.object({
      title: z.string(),
      startSec: z.number(),
      endSec: z.number(),
      quote: z.string().describe("The opening line of the clip, quoted from the transcript"),
      hook: z.string().describe("On-screen text for the first 3 seconds"),
      caption: z.string(),
      score: z.number().describe("Virality score 1-100"),
      why: z.string(),
    }),
  ),
});

export const ReportSchema = z.object({
  summary: z.string().describe("3 sentences for the brand: what happened, the standout number, and what it means"),
  highlights: z.array(z.string()),
  nextPitch: z.string().describe("One sentence proposing a follow-up campaign"),
});

export const DmSchema = z.object({
  keyword: z.string().describe("One uppercase word followers comment, e.g. LIST"),
  message: z.string().describe("The DM sent automatically — friendly, under 280 characters, includes a link placeholder"),
});

export type IdeasOut = z.infer<typeof IdeasSchema>;
export type ScriptOut = z.infer<typeof ScriptSchema>;
export type RepurposeOut = z.infer<typeof RepurposeSchema>;
export type EmailOut = z.infer<typeof EmailSchema>;
export type RepliesOut = z.infer<typeof RepliesSchema>;
export type ContractOut = z.infer<typeof ContractSchema>;
export type BioOut = z.infer<typeof BioSchema>;
export type TitlesOut = z.infer<typeof TitlesSchema>;
export type ClipsOut = z.infer<typeof ClipsSchema>;
export type ReportOut = z.infer<typeof ReportSchema>;
export type DmOut = z.infer<typeof DmSchema>;

/* ---------------- Task inputs ---------------- */

export interface CreatorBrief {
  name: string;
  handle: string;
  niches: string[];
  voice: string[];
  bio: string;
  platforms: { platform: string; followers: number; avgViews: number; engagement: number }[];
}

export interface IdeasInput {
  creator: CreatorBrief;
  prompt: string;
  platform: string; // "any" or a Platform
  recent: string[];
}

export interface ScriptInput {
  creator: CreatorBrief;
  idea: string;
  platform: string;
  sponsor?: string;
}

export interface RepurposeInput {
  creator: CreatorBrief;
  source: string;
  platforms: string[];
}

export interface PitchInput {
  creator: CreatorBrief;
  brand: string;
  manager: string;
  campaign: string;
  description: string;
  deliverables: string[];
  fitReasons: string[];
  amount: number;
  offer: number;
  tone: "warm" | "concise" | "bold";
}

export interface ReplyInput {
  creator: CreatorBrief;
  name: string;
  org?: string;
  category: string;
  messages: { from: "them" | "me"; text: string }[];
  rateHint?: number;
}

export interface ContractInput {
  text: string;
}

export interface ReminderInput {
  creator: CreatorBrief;
  brand: string;
  contact: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  remindersSent: number;
  lateFeePct: number;
}

export interface CounterInput {
  creator: CreatorBrief;
  brand: string;
  contact: string;
  campaign: string;
  offer: number;
  counter: number;
  reasons: string[];
  termChanges: string[];
}

export interface BioInput {
  creator: CreatorBrief;
  audience: string;
}

export interface TitlesInput {
  creator: CreatorBrief;
  topic: string;
}

export interface ClipsInput {
  creator: CreatorBrief;
  transcript: string;
  query?: string;
}

export interface FeedbackInput {
  creator: CreatorBrief;
  brand: string;
  contact: string;
  comments: { at: string; text: string; scope: "praise" | "in" | "out" }[];
  roundsUsed: number;
  roundsIncluded: number;
  extraFee: number;
}

export interface ReportInput {
  creator: CreatorBrief;
  brand: string;
  campaign: string;
  metrics: { views: number; avgViewDuration: string; integrationRetention: number; clicks: number; ctr: number; conversions: number; sentiment: number };
  bonus?: string;
}

export interface DmInput {
  creator: CreatorBrief;
  post: string;
  goal: string;
}

export type TaskMap = {
  titles: { input: TitlesInput; output: TitlesOut };
  clips: { input: ClipsInput; output: ClipsOut };
  feedback: { input: FeedbackInput; output: EmailOut };
  report: { input: ReportInput; output: ReportOut };
  dm: { input: DmInput; output: DmOut };
  ideas: { input: IdeasInput; output: IdeasOut };
  script: { input: ScriptInput; output: ScriptOut };
  repurpose: { input: RepurposeInput; output: RepurposeOut };
  pitch: { input: PitchInput; output: EmailOut };
  reply: { input: ReplyInput; output: RepliesOut };
  contract: { input: ContractInput; output: ContractOut };
  reminder: { input: ReminderInput; output: EmailOut };
  counter: { input: CounterInput; output: EmailOut };
  bio: { input: BioInput; output: BioOut };
};

export type TaskName = keyof TaskMap;

/* ---------------- Copilot context ---------------- */

export interface CopilotContext {
  today: string;
  creator: CreatorBrief;
  packages?: { title: string; price: number; instantBook: boolean; booked: string }[];
  bookingRequests?: { brand: string; package: string; price: number; hoursLeft: number }[];
  reviews?: { brand: string; status: string; roundsUsed: number; roundsIncluded: number; openComments: string[] }[];
  deals: {
    brand: string;
    campaign: string;
    stage: string;
    value: number;
    dueDate: string;
    paymentTerms: number;
    invoice?: { number: string; status: string; due: string };
    contractRisk?: string;
  }[];
  upcoming: { title: string; platform: string; date: string; status: string; effort: number }[];
  workload: { hours: number; capacity: number; status: string; restDays: number; busiestDay?: string };
  earnings: { ytd: number; thisMonth: number; lastMonth: number; topStream: string; topStreamShare: number };
  unreadInbox: { name: string; category: string; summary: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
