import type { AbTest, Automation, BookingRequest, Expense, Outlier, Package, QuickReply, RisingSearch } from "../types";
import { daysFromNow, hoursAgo } from "../utils";

/* All brands, channels and people below are fictional demo data. */

export function seedPackages(): Package[] {
  return [
    {
      id: "pk-integration",
      title: "YouTube integration (60–90s)",
      description: "A natural, on-camera segment inside my next desk or gear video — real usage, no script reads.",
      image: "laptopDesk",
      deliverables: [{ platform: "youtube", label: "60–90s integration", qty: 1 }],
      category: "tech",
      price: 4250,
      turnaroundDays: 21,
      usage: "30 days organic",
      revisions: 2,
      instantBook: true,
      smartPricing: true,
      slotsPerMonth: 4,
      bookedThisMonth: 2,
      active: true,
    },
    {
      id: "pk-dedicated",
      title: "Dedicated desk-setup video",
      description: "A full video built around your product, plus a YouTube Short cut-down. My best-performing format.",
      image: "deskWindow",
      deliverables: [
        { platform: "youtube", label: "Dedicated video", qty: 1 },
        { platform: "youtube", label: "YouTube Short", qty: 1 },
      ],
      category: "tech",
      price: 8500,
      turnaroundDays: 30,
      usage: "30 days organic",
      revisions: 2,
      instantBook: false,
      smartPricing: true,
      slotsPerMonth: 2,
      bookedThisMonth: 1,
      active: true,
    },
    {
      id: "pk-shortform",
      title: "Short-form pack (3 TikToks + 3 Reels)",
      description: "Six quick, loopable videos across TikTok and Instagram — ideal for launches and drops.",
      image: "phoneLaptop",
      deliverables: [
        { platform: "tiktok", label: "TikTok video", qty: 3 },
        { platform: "instagram", label: "Instagram Reel", qty: 3 },
      ],
      category: "tech",
      price: 4900,
      turnaroundDays: 14,
      usage: "30 days organic",
      revisions: 1,
      instantBook: true,
      smartPricing: false,
      slotsPerMonth: 3,
      bookedThisMonth: 0,
      active: true,
    },
    {
      id: "pk-newsletter",
      title: "Desk Notes newsletter + LinkedIn",
      description: "A featured section in Desk Notes (52% open rate) plus a LinkedIn post to a professional audience.",
      image: "typing",
      deliverables: [
        { platform: "newsletter", label: "Newsletter feature", qty: 1 },
        { platform: "linkedin", label: "LinkedIn post", qty: 1 },
      ],
      category: "tech",
      price: 950,
      turnaroundDays: 10,
      usage: "30 days organic",
      revisions: 1,
      instantBook: true,
      smartPricing: false,
      slotsPerMonth: 4,
      bookedThisMonth: 1,
      active: true,
    },
  ];
}

export function seedBookings(): BookingRequest[] {
  return [
    {
      id: "bk-kestrel",
      packageId: "pk-dedicated",
      brand: "Kestrel Keyboards",
      brandInitials: "KK",
      brandColor: "#0f766e",
      contact: "Nina Alvarez",
      brief: "We're launching the Silent65, our quietest keyboard yet, in November. We'd love a full desk-setup video built around it — your 'minimal desk' style is exactly our customer.",
      price: 8500,
      goLive: daysFromNow(35),
      createdAt: hoursAgo(5),
      brandRating: 4.9,
      status: "pending",
      instant: false,
    },
    {
      id: "bk-arcadia",
      packageId: "pk-newsletter",
      brand: "Arcadia Lighting",
      brandInitials: "AL",
      brandColor: "#b45309",
      contact: "Theo Park",
      brief: "Feature our Halo desk lamp in Desk Notes — we'll send two units.",
      price: 950,
      goLive: daysFromNow(12),
      createdAt: hoursAgo(26),
      brandRating: 4.8,
      status: "accepted",
      instant: true,
    },
  ];
}

export function seedAutomations(): Automation[] {
  return [
    {
      id: "au-list",
      name: "Gear list on request",
      trigger: "comment_keyword",
      triggerDetail: "Someone comments “LIST” on a desk or gear video",
      action: "Send a DM with my gear list (affiliate links)",
      message: "Hey! 👋 Here's everything on my desk, with links: mayamakes.example/gear — tell me what you end up getting!",
      on: true,
      runs: 1284,
      metric: "38% clicked the link",
      platform: "instagram",
    },
    {
      id: "au-inquiry",
      name: "Instant reply to brand inquiries",
      trigger: "new_inquiry",
      triggerDetail: "A new brand email arrives (AI-detected)",
      action: "Reply within 5 minutes with my rate card, media kit and bookable packages",
      message: "Thanks for reaching out! My media kit and bookable packages are here: creatorai.example/c/mayamakes — I'll follow up personally within a day.",
      on: true,
      runs: 23,
      metric: "First reply in ~4 min",
      platform: "email",
    },
    {
      id: "au-invoice",
      name: "Payment follow-ups",
      trigger: "invoice_overdue",
      triggerDetail: "An invoice passes its due date",
      action: "Friendly nudge on the due date → firm reminder at +7 days → final notice at +21 days",
      on: true,
      runs: 9,
      metric: "6 invoices paid after a reminder",
      platform: "email",
    },
    {
      id: "au-ftc",
      name: "Disclosure guard",
      trigger: "post_scheduled",
      triggerDetail: "A sponsored post is scheduled",
      action: "Check the caption for a clear #ad disclosure near the start — hold the post and notify me if it's missing",
      on: true,
      runs: 14,
      metric: "2 captions fixed before posting",
    },
    {
      id: "au-rest",
      name: "Sunday rest day",
      trigger: "weekly",
      triggerDetail: "Every Sunday",
      action: "Block scheduling, snooze non-urgent notifications and let the inbox auto-reply handle brands",
      on: true,
      runs: 18,
      metric: "18 Sundays off in a row",
    },
    {
      id: "au-collab",
      name: "Collab requests",
      trigger: "dm_keyword",
      triggerDetail: "A DM contains “collab”",
      action: "Reply with my availability and a short collab form",
      message: "Love that you want to collab! 🙌 Here's my availability and a 2-minute form: creatorai.example/c/mayamakes/collab",
      on: false,
      runs: 0,
      platform: "tiktok",
    },
  ];
}

export function seedQuickReplies(): QuickReply[] {
  return [
    { id: "qr-rate", label: "Rate card", text: "Thanks for reaching out! You can see my packages and book a slot directly here: creatorai.example/c/mayamakes — happy to tailor something if none fit." },
    { id: "qr-avail", label: "Availability", text: "I have two sponsorship slots open next month. If you share your timeline and deliverables, I'll send a proposal within 24 hours." },
    { id: "qr-gear", label: "Gear list", text: "Everything on my desk is linked here: mayamakes.example/gear 🙌" },
    { id: "qr-decline", label: "Polite decline", text: "Thank you so much for thinking of me! This one isn't the right fit for my audience right now, but I'd love to stay in touch for future campaigns." },
  ];
}

export function seedAbTests(): AbTest[] {
  return [
    {
      id: "ab-desk",
      video: "Minimal desk tour 2026",
      status: "running",
      daysLeft: 4,
      impressions: 214_000,
      variants: [
        { title: "I deleted 80% of my desk", thumb: "deskWindow", thumbText: "80% GONE", share: 0.46 },
        { title: "My minimal desk tour (2026)", thumb: "macbookWood", thumbText: "MINIMAL", share: 0.31 },
        { title: "The desk that fixed my focus", thumb: "laptopDesk", thumbText: "FOCUS", share: 0.23 },
      ],
    },
  ];
}

export function seedExpenses(): Expense[] {
  return [
    { id: "ex1", date: daysFromNow(-3), merchant: "Lens Depot", amount: 1249, category: "Gear", deductible: true, aiNote: "Camera lens used for filming — equipment" },
    { id: "ex2", date: daysFromNow(-6), merchant: "CutPro Editor (annual)", amount: 299, category: "Software", deductible: true, aiNote: "Editing software subscription" },
    { id: "ex3", date: daysFromNow(-9), merchant: "Isla Chen — video editing", amount: 1050, category: "Contractors", deductible: true, aiNote: "3 videos edited · keep their W-9 on file for year-end 1099 reporting" },
    { id: "ex4", date: daysFromNow(-12), merchant: "Fiber internet", amount: 89, category: "Home office", deductible: true, aiNote: "Partly deductible — business-use share of home internet" },
    { id: "ex5", date: daysFromNow(-15), merchant: "Grocery Mart", amount: 142, category: "Personal", deductible: false, aiNote: "Looks personal — not deducted" },
    { id: "ex6", date: daysFromNow(-20), merchant: "Flight to Denver (creator summit)", amount: 386, category: "Travel", deductible: true, aiNote: "Business travel for an industry event" },
  ];
}

export const OUTLIERS: Outlier[] = [
  { id: "o1", title: "The $40 upgrade that fixed my back", channel: "Ergo Lab", channelSubs: 31_000, views: 410_000, multiplier: 15.2, format: "Short", thumb: "keyboard", daysAgo: 4, topic: "Ergonomics", why: "Pain-point hook + specific price. Small channel, huge reach: the topic, not the creator, did the work — a strong signal for you." },
  { id: "o2", title: "The cable trick nobody tells you about", channel: "Tidy Desk Club", channelSubs: 42_000, views: 980_000, multiplier: 22.4, format: "Short", thumb: "macbookWood", daysAgo: 6, topic: "Cable management", why: "Curiosity-gap title and a satisfying before/after in under 20 seconds. Your monitor-arm Short used the same structure." },
  { id: "o3", title: "I tried a $20 desk vs a $2,000 desk", channel: "Pixel & Pine", channelSubs: 180_000, views: 2_400_000, multiplier: 13.3, format: "Long-form", thumb: "deskWindow", daysAgo: 9, topic: "Price comparison", why: "Extreme price contrast makes the click irresistible; the verdict ('the cheap one won') drove 9K comments." },
  { id: "o4", title: "I used one 13-inch screen for 30 days", channel: "Nomad Notes", channelSubs: 95_000, views: 760_000, multiplier: 9.2, format: "Long-form", thumb: "laptopGlow", daysAgo: 12, topic: "Minimalism", why: "A constraint challenge — the same 'less is more' angle as your top video, from the opposite direction." },
  { id: "o5", title: "My desk setup, rated by an interior designer", channel: "Studio Sundays", channelSubs: 140_000, views: 1_100_000, multiplier: 7.4, format: "Long-form", thumb: "laptopDesk", daysAgo: 15, topic: "Expert reaction", why: "Borrowed authority: an outside expert judging the setup creates tension and new talking points." },
  { id: "o6", title: "Mechanical keyboards are a scam (kind of)", channel: "Keycap Kai", channelSubs: 220_000, views: 1_600_000, multiplier: 6.1, format: "Long-form", thumb: "keyboard", daysAgo: 18, topic: "Contrarian take", why: "Contrarian title with a hedge — invites debate without alienating fans. Comment rate 3× normal." },
  { id: "o7", title: "AI gadgets I returned after a week", channel: "Gadget Grief", channelSubs: 410_000, views: 2_200_000, multiplier: 5.3, format: "Long-form", thumb: "vr", daysAgo: 7, topic: "Honest reviews", why: "Negative framing on a hyped category; honest takes outperform hype in your audience's viewing history." },
  { id: "o8", title: "Desk lamp vs. monitor light bar", channel: "Bright Ideas", channelSubs: 28_000, views: 260_000, multiplier: 11.8, format: "Short", thumb: "uiDesign", daysAgo: 3, topic: "Lighting", why: "Searches for 'monitor light bar' are up 96% this month — this Short rode the wave." },
];

export const RISING_SEARCHES: RisingSearch[] = [
  { term: "ai pin review", growth: 2.2, competition: "Low", volume: "48K / mo" },
  { term: "quiet mechanical keyboard", growth: 1.84, competition: "Low", volume: "31K / mo" },
  { term: "monitor light bar", growth: 0.96, competition: "Medium", volume: "62K / mo" },
  { term: "standing desk worth it", growth: 0.61, competition: "Medium", volume: "40K / mo" },
  { term: "desk setup under 500", growth: 0.48, competition: "High", volume: "110K / mo" },
  { term: "cable management hacks", growth: 0.35, competition: "High", volume: "95K / mo" },
];
