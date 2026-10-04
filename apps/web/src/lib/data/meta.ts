import type { Category, DealStage, InboxCategory, Platform, Stream } from "../types";

export const PLATFORMS: Record<Platform, { label: string; color: string; short: string }> = {
  youtube: { label: "YouTube", color: "#ff0033", short: "YT" },
  tiktok: { label: "TikTok", color: "#111111", short: "TT" },
  instagram: { label: "Instagram", color: "#d62976", short: "IG" },
  x: { label: "X", color: "#0f1419", short: "X" },
  linkedin: { label: "LinkedIn", color: "#0a66c2", short: "in" },
  newsletter: { label: "Newsletter", color: "#e8590c", short: "NL" },
  twitch: { label: "Twitch", color: "#9146ff", short: "TW" },
  podcast: { label: "Podcast", color: "#7c3aed", short: "POD" },
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "beauty", label: "Beauty" },
  { id: "fitness", label: "Fitness" },
  { id: "gaming", label: "Gaming" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "finance", label: "Finance" },
  { id: "fashion", label: "Fashion" },
  { id: "education", label: "Education" },
  { id: "wellness", label: "Wellness" },
  { id: "music", label: "Audio & Music" },
  { id: "photography", label: "Photography" },
  { id: "parenting", label: "Family" },
];

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

export const STAGES: { id: DealStage; label: string; hint: string }[] = [
  { id: "inbound", label: "Inbound", hint: "Detected by AI in your inbox" },
  { id: "pitched", label: "Pitched", hint: "Waiting on the brand" },
  { id: "negotiating", label: "Negotiating", hint: "Rates & terms in discussion" },
  { id: "contracted", label: "Contracted", hint: "Signed — ready to make" },
  { id: "production", label: "In production", hint: "Scripting, filming, editing" },
  { id: "invoiced", label: "Invoiced", hint: "Delivered — awaiting payment" },
  { id: "paid", label: "Paid", hint: "Money in the bank" },
];

export const INBOX_CATEGORIES: Record<InboxCategory, { label: string; color: string; bg: string }> = {
  deal: { label: "Brand deal", color: "#008a05", bg: "#e8f5e9" },
  collab: { label: "Collab", color: "#1a73e8", bg: "#eef4fe" },
  fan: { label: "Community", color: "#6a6a6a", bg: "#f2f2f2" },
  spam: { label: "Likely scam", color: "#c13515", bg: "#fff4f0" },
  ops: { label: "Admin", color: "#b45309", bg: "#fff8eb" },
};

export const STREAMS: { id: Stream; label: string; color: string }[] = [
  { id: "deals", label: "Brand deals", color: "#ff385c" },
  { id: "ads", label: "Ad revenue", color: "#92174d" },
  { id: "affiliate", label: "Affiliate", color: "#f59e0b" },
  { id: "members", label: "Memberships", color: "#0ea5a4" },
  { id: "products", label: "Digital products", color: "#6366f1" },
];
