import type { ImageKey } from "./images";

export type Platform = "youtube" | "tiktok" | "instagram" | "x" | "linkedin" | "newsletter" | "twitch" | "podcast";

export type Category =
  | "tech"
  | "beauty"
  | "fitness"
  | "gaming"
  | "food"
  | "travel"
  | "finance"
  | "fashion"
  | "education"
  | "wellness"
  | "music"
  | "photography"
  | "parenting";

/* ---------------- Creator ---------------- */

export interface PlatformStat {
  platform: Platform;
  handle: string;
  followers: number;
  growth30d: number; // fraction, e.g. 0.034
  engagement: number; // fraction
  avgViews: number;
  connected: boolean;
}

export interface CreatorProfile {
  name: string;
  firstName: string;
  handle: string;
  avatar: ImageKey;
  niches: Category[];
  location: string;
  bio: string;
  voice: string[];
  joinedYear: number;
  superCreator: boolean;
  platforms: PlatformStat[];
  audience: {
    age: { label: string; value: number }[];
    gender: { label: string; value: number }[];
    countries: { label: string; value: number }[];
  };
  goals: string[];
  weeklyCapacityHours: number;
}

/* ---------------- Marketplace ---------------- */

export interface Deliverable {
  platform: Platform;
  label: string;
  qty: number;
}

export interface BrandReview {
  id: string;
  author: string;
  avatar: ImageKey;
  meta: string;
  date: string;
  rating: number;
  text: string;
}

export interface Campaign {
  id: string;
  brand: string;
  brandInitials: string;
  brandColor: string;
  manager: { name: string; role: string; avatar: ImageKey; years: number };
  title: string;
  category: Category;
  platforms: Platform[];
  deliverables: Deliverable[];
  images: ImageKey[];
  base: number;
  bonus: number;
  bonusNote: string;
  paymentDays: number;
  onTimeRate: number;
  rating: number;
  reviewCount: number;
  ratings: {
    payment: number;
    communication: number;
    freedom: number;
    fairness: number;
    clarity: number;
    again: number;
  };
  creatorFavorite: boolean;
  isNew: boolean;
  usageRights: string;
  exclusivity: string;
  killFee: string;
  applyByDays: number;
  goLiveDays: number;
  description: string;
  highlights: { icon: "zap" | "palette" | "shield" | "clock" | "repeat" | "globe" | "gift"; title: string; text: string }[];
  minFollowers: number;
  regions: string;
  fit: number; // AI fit score for the signed-in creator, 0-100
  fitReasons: string[];
  spotsLeft: number;
  applicants: number;
  reviews: BrandReview[];
}

export interface CollabListing {
  id: string;
  name: string;
  avatar: ImageKey;
  cover: ImageKey;
  niche: Category;
  platform: Platform;
  followers: number;
  lookingFor: string;
  location: string;
  rating: number;
  overlap: number; // audience overlap with you
  badge?: string;
}

export interface ServiceListing {
  id: string;
  name: string;
  avatar: ImageKey;
  cover: ImageKey;
  service: string;
  price: number;
  unit: string;
  rating: number;
  reviews: number;
  turnaround: string;
  badge?: string;
}

/* ---------------- Studio: deals pipeline ---------------- */

export type DealStage = "inbound" | "pitched" | "negotiating" | "contracted" | "production" | "invoiced" | "paid";

export interface ContractFlag {
  severity: "high" | "medium" | "low";
  title: string;
  clause: string;
  issue: string;
  suggestion: string;
}

export interface ContractScan {
  score: number; // 0-100 creator-friendliness
  summary: string;
  flags: ContractFlag[];
  source: AiSource;
}

export interface Invoice {
  number: string;
  issued: string;
  due: string;
  status: "draft" | "sent" | "overdue" | "paid";
  remindersSent: number;
  lateFeePct: number;
  paidOn?: string;
}

export interface Deal {
  id: string;
  brand: string;
  brandInitials: string;
  brandColor: string;
  campaign: string;
  campaignId?: string;
  category: Category;
  value: number;
  bonus?: number;
  stage: DealStage;
  platform: Platform;
  deliverables: { id: string; label: string; done: boolean }[];
  dueDate: string;
  goLive?: string;
  paymentTerms: number;
  invoice?: Invoice;
  contact: { name: string; email: string };
  contractText?: string;
  contractScan?: ContractScan;
  notes?: string;
  source: "marketplace" | "inbox" | "direct" | "package";
  createdAt: string;
  pitch?: string;
  packageId?: string;
  /** CreatorCover: brand pays up front, funds held until approval. */
  escrow?: { amount: number; status: "funded" | "released"; fundedOn: string; autoReleaseDays: number };
  review?: DraftReview;
  report?: CampaignReport;
  caption?: string;
}

/* ---------------- Packages & bookings (Passionfroot / Collabstr / Airbnb Instant Book) ---------------- */

export interface Package {
  id: string;
  title: string;
  description: string;
  image: ImageKey;
  deliverables: Deliverable[];
  category: Category;
  price: number;
  turnaroundDays: number;
  usage: string;
  revisions: number;
  instantBook: boolean;
  smartPricing: boolean;
  slotsPerMonth: number;
  bookedThisMonth: number;
  active: boolean;
}

export interface BookingRequest {
  id: string;
  packageId: string;
  brand: string;
  brandInitials: string;
  brandColor: string;
  contact: string;
  brief: string;
  price: number;
  goLive: string;
  createdAt: string; // ISO datetime
  brandRating: number;
  status: "pending" | "accepted" | "declined";
  instant: boolean;
}

/* ---------------- Draft review room (Frame.io-style) ---------------- */

export interface ReviewComment {
  id: string;
  at: number; // seconds into the draft
  author: string;
  text: string;
  scope: "praise" | "in" | "out";
  resolved: boolean;
}

export interface DraftReview {
  version: number;
  roundsUsed: number;
  roundsIncluded: number;
  submittedAt: string; // ISO datetime
  durationSec: number;
  thumb: ImageKey;
  status: "awaiting" | "changes" | "approved";
  comments: ReviewComment[];
}

/* ---------------- Campaign report ---------------- */

export interface CampaignReport {
  views: number;
  avgViewDuration: string;
  integrationRetention: number;
  clicks: number;
  ctr: number;
  conversions: number;
  sentiment: number; // share of positive comments
  bonusTarget?: { label: string; metric: "ctr" | "views"; threshold: number; amount: number; claimed: boolean };
  topComments: string[];
}

/* ---------------- Automations (ManyChat / Airbnb scheduled replies) ---------------- */

export type AutomationTrigger = "comment_keyword" | "dm_keyword" | "new_inquiry" | "invoice_overdue" | "post_scheduled" | "collab_request" | "weekly";

export interface Automation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  triggerDetail: string;
  action: string;
  message?: string;
  on: boolean;
  runs: number;
  metric?: string;
  platform?: Platform | "email";
}

export interface QuickReply {
  id: string;
  label: string;
  text: string;
}

/* ---------------- Packaging tests (YouTube Test & Compare) ---------------- */

export interface AbTest {
  id: string;
  video: string;
  status: "running" | "done";
  daysLeft: number;
  impressions: number;
  variants: { title: string; thumb: ImageKey; thumbText: string; share: number }[];
}

/* ---------------- Money ---------------- */

export interface TaxPayment {
  id: string;
  label: string;
  period: string;
  due: string;
  amount: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: "Gear" | "Software" | "Home office" | "Travel" | "Contractors" | "Personal";
  deductible: boolean;
  aiNote: string;
}

/* ---------------- Trend radar (Spotter / vidIQ / 1of10) ---------------- */

export interface Outlier {
  id: string;
  title: string;
  channel: string;
  channelSubs: number;
  views: number;
  multiplier: number;
  format: "Long-form" | "Short";
  thumb: ImageKey;
  daysAgo: number;
  topic: string;
  why: string;
}

export interface RisingSearch {
  term: string;
  growth: number; // fraction, 30-day
  competition: "Low" | "Medium" | "High";
  volume: string;
}

/* ---------------- Studio: content ---------------- */

export type ContentStatus = "idea" | "scripting" | "filming" | "editing" | "scheduled" | "published";

export interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  format: string;
  status: ContentStatus;
  date: string;
  time?: string;
  dealId?: string;
  effort: number; // hours
  notes?: string;
  aiGenerated?: boolean;
  /** Links into the video pipeline: the project this post is produced in, and the export that ships it. */
  projectId?: string;
  exportId?: string;
}

/* ---------------- Studio: inbox ---------------- */

export type InboxCategory = "deal" | "collab" | "fan" | "spam" | "ops";

export interface InboxMessage {
  id: string;
  from: "them" | "me";
  text: string;
  at: string; // ISO datetime
}

export interface Thread {
  id: string;
  name: string;
  avatar?: ImageKey;
  initials?: string;
  color?: string;
  org?: string;
  channel: Platform | "email";
  category: InboxCategory;
  priority: "high" | "medium" | "low";
  unread: boolean;
  subject: string;
  summary: string;
  messages: InboxMessage[];
  dealSignal?: { brand: string; campaign: string; estValue: number; platform: Platform; category: Category };
  scamSignal?: string;
  converted?: boolean;
}

/* ---------------- Earnings & insights ---------------- */

export type Stream = "deals" | "ads" | "affiliate" | "members" | "products";

export interface MonthEarnings {
  month: string; // "2026-01"
  deals: number;
  ads: number;
  affiliate: number;
  members: number;
  products: number;
}

/** A post's numbers imported by the creator (CSV from YouTube Studio, Meta, TikTok…). */
export interface ImportedPost {
  id: string;
  title: string;
  platform: Platform;
  /** ISO timestamp ("" when the export had no date). */
  published: string;
  /** True when the export included the posting time, not just the day. */
  hasTime?: boolean;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface PostPerf {
  id: string;
  title: string;
  platform: Platform;
  format: string;
  thumb: ImageKey;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retention: number;
  vsAvg: number; // multiplier vs channel average
  daysAgo: number;
  why: string;
}

/* ---------------- AI ---------------- */

export type AiSource = "claude" | "local";

export interface IdeaResult {
  title: string;
  hook: string;
  platform: Platform;
  format: string;
  why: string;
  score: number;
  effort: number;
}

export interface RepurposeOutput {
  platform: Platform;
  format: string;
  content: string;
}

export interface ScriptResult {
  title: string;
  hook: string;
  sections: { heading: string; beats: string[]; broll?: string }[];
  cta: string;
  thumbnailIdeas: string[];
}
