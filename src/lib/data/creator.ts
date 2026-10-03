import type { CreatorProfile } from "../types";

export const CREATOR: CreatorProfile = {
  name: "Maya Rivera",
  firstName: "Maya",
  handle: "mayamakes",
  avatar: "pMaya",
  niches: ["tech", "education"],
  location: "Austin, TX",
  bio: "I make honest, nerdy tech reviews and desk-setup tours for people who want gear that actually earns its spot. 6 years on YouTube, former UX designer, forever chasing the perfect cable management.",
  voice: ["Warm & witty", "Nerdy but never gatekeepy", "Straight-to-the-point", "Data-backed opinions"],
  joinedYear: 2021,
  superCreator: true,
  platforms: [
    { platform: "youtube", handle: "@mayamakes", followers: 412_000, growth30d: 0.034, engagement: 0.061, avgViews: 148_000, connected: true },
    { platform: "tiktok", handle: "@mayamakes", followers: 531_000, growth30d: 0.052, engagement: 0.084, avgViews: 96_000, connected: true },
    { platform: "instagram", handle: "@maya.makes", followers: 186_000, growth30d: 0.018, engagement: 0.047, avgViews: 41_000, connected: true },
    { platform: "x", handle: "@mayamakes", followers: 48_200, growth30d: 0.009, engagement: 0.021, avgViews: 12_000, connected: true },
    { platform: "linkedin", handle: "in/mayarivera", followers: 22_400, growth30d: 0.041, engagement: 0.038, avgViews: 9_400, connected: true },
    { platform: "newsletter", handle: "Desk Notes", followers: 31_800, growth30d: 0.027, engagement: 0.52, avgViews: 16_500, connected: true },
  ],
  audience: {
    age: [
      { label: "13–17", value: 0.06 },
      { label: "18–24", value: 0.31 },
      { label: "25–34", value: 0.38 },
      { label: "35–44", value: 0.16 },
      { label: "45+", value: 0.09 },
    ],
    gender: [
      { label: "Women", value: 0.46 },
      { label: "Men", value: 0.51 },
      { label: "Other", value: 0.03 },
    ],
    countries: [
      { label: "United States", value: 0.44 },
      { label: "United Kingdom", value: 0.11 },
      { label: "Canada", value: 0.08 },
      { label: "India", value: 0.07 },
      { label: "Germany", value: 0.05 },
    ],
  },
  goals: ["Land better brand deals", "Post consistently without burning out"],
  weeklyCapacityHours: 32,
};

export const totalFollowers = (c: CreatorProfile) => c.platforms.reduce((s, p) => s + p.followers, 0);

export const avgEngagement = (c: CreatorProfile) => {
  const social = c.platforms.filter((p) => p.platform !== "newsletter");
  const total = social.reduce((s, p) => s + p.followers, 0);
  return social.reduce((s, p) => s + p.engagement * p.followers, 0) / total;
};
