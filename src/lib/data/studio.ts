import type { ContentItem, Deal, MonthEarnings, PostPerf, Thread } from "../types";
import { daysFromNow, hoursAgo } from "../utils";

/**
 * Seed data for the signed-in creator's Studio. Built relative to "today" so the
 * demo always looks live (deadlines this week, an overdue invoice, etc.).
 */

const RISKY_CONTRACT = `INFLUENCER AGREEMENT — Halcyon VR x Creator

1. Deliverables. Creator shall produce one (1) dedicated YouTube video and three (3) TikTok videos featuring the Halcyon One headset.

2. Compensation. Brand shall pay Creator USD $5,200. Payment terms are net ninety (90) days from the date Brand receives payment approval from its client.

3. Usage Rights. Creator grants Brand a perpetual, irrevocable, worldwide license to use, edit, and repurpose the Content in all media now known or hereafter devised, including paid advertising, without additional compensation.

4. Exclusivity. Creator shall not promote any consumer electronics products for ninety (90) days following publication.

5. Revisions. Creator shall make unlimited revisions requested by Brand prior to publication.

6. Termination. Brand may terminate this Agreement at any time for any reason without payment for work completed.

7. Morality. Brand may withhold payment if Creator engages in conduct Brand deems, in its sole discretion, inappropriate.`;

const GOOD_CONTRACT = `CREATOR PARTNERSHIP AGREEMENT — Lumen Audio x Maya Rivera

1. Deliverables. One (1) 60–90 second integration within a YouTube video, two (2) YouTube Shorts and one (1) TikTok cross-post.

2. Fee. USD $4,800, plus a performance bonus of $8 CPM on views above 150,000 in the first 30 days, capped at $1,200.

3. Payment. Net fourteen (14) days from invoice. Late payments accrue interest at 1.5% per month.

4. Usage. Brand may repost the Content organically on its owned channels for thirty (30) days. Paid usage requires a separate written agreement.

5. Exclusivity. Fourteen (14) days, limited to over-ear headphones.

6. Revisions. Up to two (2) rounds of reasonable revisions on the concept; no script approval.

7. Kill fee. If Brand cancels after concept approval, Creator receives 50% of the Fee.`;

export function seedDeals(): Deal[] {
  return [
    {
      id: "d-lumen",
      brand: "Lumen Audio",
      brandInitials: "LA",
      brandColor: "#111827",
      campaign: "Studio Max launch integration",
      campaignId: "lumen-studio-max",
      category: "tech",
      value: 4800,
      bonus: 1200,
      stage: "production",
      platform: "youtube",
      deliverables: [
        { id: "x1", label: "Concept approved", done: true },
        { id: "x2", label: "Script & talking points", done: true },
        { id: "x3", label: "Film integration", done: true },
        { id: "x4", label: "Send draft for review", done: false },
        { id: "x5", label: "Publish + 2 Shorts", done: false },
      ],
      dueDate: daysFromNow(2),
      goLive: daysFromNow(9),
      paymentTerms: 14,
      contact: { name: "Priya Shah", email: "priya@lumen-audio.example" },
      contractText: GOOD_CONTRACT,
      source: "marketplace",
      createdAt: daysFromNow(-24),
      escrow: { amount: 4800, status: "funded", fundedOn: daysFromNow(-20), autoReleaseDays: 5 },
      caption: "These headphones changed how I edit 🎧 60 hours of battery is no joke. Link in bio! #lumen #sp",
      review: {
        version: 1,
        roundsUsed: 0,
        roundsIncluded: 2,
        submittedAt: hoursAgo(28),
        durationSec: 94,
        thumb: "headphonesYellow",
        status: "changes",
        comments: [
          { id: "rc1", at: 6, author: "Priya (Lumen)", text: "Love the cold open — please keep it exactly as is!", scope: "praise", resolved: false },
          { id: "rc2", at: 41, author: "Priya (Lumen)", text: "Could you mention the 60-hour battery life on camera? It's our key launch message.", scope: "in", resolved: false },
          { id: "rc3", at: 63, author: "Legal (Lumen)", text: "Please remove the line comparing us to other brands' headphones.", scope: "in", resolved: false },
          { id: "rc4", at: 80, author: "Priya (Lumen)", text: "Also — could you add a 30-second segment showing our new Lumen Buds?", scope: "out", resolved: false },
        ],
      },
    },
    {
      id: "d-ledgerly",
      brand: "Ledgerly",
      brandInitials: "L",
      brandColor: "#15803d",
      campaign: "Creator tax season explainer",
      campaignId: "ledgerly",
      category: "finance",
      value: 3200,
      stage: "invoiced",
      platform: "youtube",
      deliverables: [
        { id: "x1", label: "Integration published", done: true },
        { id: "x2", label: "Newsletter feature sent", done: true },
        { id: "x3", label: "Performance report shared", done: true },
      ],
      dueDate: daysFromNow(-24),
      paymentTerms: 15,
      invoice: { number: "INV-0142", issued: daysFromNow(-24), due: daysFromNow(-9), status: "overdue", remindersSent: 0, lateFeePct: 1.5 },
      contact: { name: "Omar Siddiqui", email: "omar@ledgerly.example" },
      source: "marketplace",
      createdAt: daysFromNow(-52),
    },
    {
      id: "d-pixelpad",
      brand: "Pixelpad",
      brandInitials: "PP",
      brandColor: "#9333ea",
      campaign: "Creative workflow integration",
      campaignId: "pixelpad",
      category: "tech",
      value: 3900,
      bonus: 800,
      stage: "invoiced",
      platform: "youtube",
      deliverables: [
        { id: "x1", label: "Integration published", done: true },
        { id: "x2", label: "2 TikToks published", done: true },
      ],
      dueDate: daysFromNow(-6),
      paymentTerms: 14,
      invoice: { number: "INV-0145", issued: daysFromNow(-6), due: daysFromNow(8), status: "sent", remindersSent: 0, lateFeePct: 1.5 },
      contact: { name: "Isla Chen", email: "isla@pixelpad.example" },
      source: "marketplace",
      createdAt: daysFromNow(-40),
      report: {
        views: 186_000,
        avgViewDuration: "4:12",
        integrationRetention: 0.94,
        clicks: 3420,
        ctr: 0.0184,
        conversions: 212,
        sentiment: 0.91,
        bonusTarget: { label: "Landing-page CTR above 1.5%", metric: "ctr", threshold: 0.015, amount: 800, claimed: false },
        topComments: ["Ok the tablet workflow part actually sold me 😅", "Finally a sponsor segment I didn't skip", "How does it compare to drawing on an iPad?"],
      },
    },
    {
      id: "d-orbit",
      brand: "Orbit Wearables",
      brandInitials: "OW",
      brandColor: "#0f766e",
      campaign: "Orbit 3 week-on-wrist review",
      campaignId: "orbit-watch",
      category: "tech",
      value: 3600,
      bonus: 600,
      stage: "contracted",
      platform: "youtube",
      deliverables: [
        { id: "x1", label: "Receive product", done: true },
        { id: "x2", label: "Wear for 7 days & log notes", done: false },
        { id: "x3", label: "Film review segment", done: false },
        { id: "x4", label: "Instagram carousel", done: false },
      ],
      dueDate: daysFromNow(12),
      goLive: daysFromNow(16),
      paymentTerms: 21,
      contact: { name: "Dev Patel", email: "dev@orbitwear.example" },
      source: "marketplace",
      createdAt: daysFromNow(-10),
      escrow: { amount: 3600, status: "funded", fundedOn: daysFromNow(-8), autoReleaseDays: 5 },
    },
    {
      id: "d-arcadia",
      brand: "Arcadia Lighting",
      brandInitials: "AL",
      brandColor: "#b45309",
      campaign: "Desk Notes newsletter + LinkedIn",
      category: "tech",
      value: 950,
      stage: "contracted",
      platform: "newsletter",
      deliverables: [
        { id: "x1", label: "Newsletter feature", done: false },
        { id: "x2", label: "LinkedIn post", done: false },
      ],
      dueDate: daysFromNow(10),
      goLive: daysFromNow(12),
      paymentTerms: 0,
      contact: { name: "Theo Park", email: "theo@arcadia.example" },
      source: "package",
      packageId: "pk-newsletter",
      createdAt: daysFromNow(-1),
      escrow: { amount: 950, status: "funded", fundedOn: daysFromNow(-1), autoReleaseDays: 5 },
      notes: "Instant-booked from your Desk Notes package. Paid up front via CreatorCover.",
    },
    {
      id: "d-halcyon",
      brand: "Halcyon VR",
      brandInitials: "HV",
      brandColor: "#4338ca",
      campaign: "First hour in VR",
      campaignId: "halcyon-vr",
      category: "gaming",
      value: 5200,
      bonus: 1300,
      stage: "negotiating",
      platform: "youtube",
      deliverables: [
        { id: "x1", label: "Dedicated video", done: false },
        { id: "x2", label: "3 reaction TikToks", done: false },
      ],
      dueDate: daysFromNow(20),
      paymentTerms: 90,
      contact: { name: "Andre Lewis", email: "andre@halcyonvr.example" },
      contractText: RISKY_CONTRACT,
      source: "inbox",
      createdAt: daysFromNow(-4),
      notes: "They want to close this week. Contract arrived yesterday.",
    },
    {
      id: "d-sonora",
      brand: "Sonora Audio",
      brandInitials: "SA",
      brandColor: "#b91c1c",
      campaign: "Podcast mic shootout",
      campaignId: "sonora-mic",
      category: "music",
      value: 3400,
      stage: "pitched",
      platform: "youtube",
      deliverables: [{ id: "x1", label: "Mic comparison video", done: false }],
      dueDate: daysFromNow(30),
      paymentTerms: 21,
      contact: { name: "Kai Nakamura", email: "kai@sonora.example" },
      source: "marketplace",
      createdAt: daysFromNow(-3),
      pitch: "Hi Kai — I've reviewed four podcast mics this year and my audience keeps asking for a blind shootout...",
    },
    {
      id: "d-northstar",
      brand: "Northstar VPN",
      brandInitials: "NV",
      brandColor: "#0f172a",
      campaign: "Q4 YouTube integrations (x3)",
      category: "tech",
      value: 9000,
      stage: "inbound",
      platform: "youtube",
      deliverables: [{ id: "x1", label: "3 × 60s integrations", done: false }],
      dueDate: daysFromNow(45),
      paymentTerms: 30,
      contact: { name: "Hannah Lee", email: "hannah@northstar.example" },
      source: "inbox",
      createdAt: daysFromNow(-1),
    },
    {
      id: "d-brightpath-old",
      brand: "Brightpath Academy",
      brandInitials: "BA",
      brandColor: "#2563eb",
      campaign: "Back-to-school coding sprint",
      category: "education",
      value: 3500,
      stage: "paid",
      platform: "youtube",
      deliverables: [{ id: "x1", label: "Integration published", done: true }],
      dueDate: daysFromNow(-41),
      paymentTerms: 14,
      invoice: { number: "INV-0138", issued: daysFromNow(-41), due: daysFromNow(-27), status: "paid", remindersSent: 0, lateFeePct: 1.5, paidOn: daysFromNow(-30) },
      contact: { name: "Grace Owusu", email: "grace@brightpath.example" },
      source: "marketplace",
      createdAt: daysFromNow(-70),
    },
    {
      id: "d-halo-old",
      brand: "Halo Desk Co.",
      brandInitials: "HD",
      brandColor: "#7c5c3b",
      campaign: "Summer desk refresh",
      category: "tech",
      value: 5800,
      stage: "paid",
      platform: "youtube",
      deliverables: [{ id: "x1", label: "Desk makeover video", done: true }],
      dueDate: daysFromNow(-63),
      paymentTerms: 30,
      invoice: { number: "INV-0131", issued: daysFromNow(-63), due: daysFromNow(-33), status: "paid", remindersSent: 1, lateFeePct: 1.5, paidOn: daysFromNow(-29) },
      contact: { name: "Marcus Bell", email: "marcus@halodesk.example" },
      source: "marketplace",
      createdAt: daysFromNow(-90),
    },
  ];
}

export function seedContent(): ContentItem[] {
  const c = (o: Omit<ContentItem, "id"> & { id?: string }, i: number): ContentItem => ({ id: o.id ?? `ct${i}`, ...o });
  return [
    { title: "Studio Max — honest first look (sponsored)", platform: "youtube", format: "Long video", status: "editing", date: daysFromNow(2), time: "17:00", dealId: "d-lumen", effort: 6 },
    { title: "Is spatial audio a gimmick? (Short)", platform: "youtube", format: "Short", status: "scripting", date: daysFromNow(3), time: "12:00", dealId: "d-lumen", effort: 1.5 },
    { title: "My $40 cable-management trick", platform: "tiktok", format: "Short", status: "scheduled", date: daysFromNow(0), time: "18:30", effort: 1 },
    { title: "Desk Notes #87: the gear I returned", platform: "newsletter", format: "Newsletter", status: "scheduled", date: daysFromNow(1), time: "08:00", effort: 2 },
    { title: "5 desk upgrades under $50", platform: "instagram", format: "Carousel", status: "filming", date: daysFromNow(4), time: "11:00", effort: 2 },
    { title: "Why I quit ultrawide monitors", platform: "youtube", format: "Long video", status: "idea", date: daysFromNow(6), effort: 8 },
    { title: "What 6 years of YouTube taught me about burnout", platform: "linkedin", format: "Post", status: "scheduled", date: daysFromNow(1), time: "09:00", effort: 1 },
    { title: "Orbit 3 — day 1 unboxing", platform: "instagram", format: "Reel", status: "idea", date: daysFromNow(7), dealId: "d-orbit", effort: 1.5 },
    { title: "Thread: the real cost of a desk setup", platform: "x", format: "Thread", status: "scheduled", date: daysFromNow(3), time: "15:00", effort: 1 },
    { title: "Minimal desk tour 2026", platform: "youtube", format: "Long video", status: "published", date: daysFromNow(-3), time: "17:00", effort: 7 },
    { title: "Keyboard ASMR, but make it productive", platform: "tiktok", format: "Short", status: "published", date: daysFromNow(-2), time: "19:00", effort: 1 },
    { title: "Monitor arm install in 60 seconds", platform: "tiktok", format: "Short", status: "published", date: daysFromNow(-1), time: "18:00", effort: 1 },
    { title: "Desk Notes #86", platform: "newsletter", format: "Newsletter", status: "published", date: daysFromNow(-6), time: "08:00", effort: 2 },
    { title: "Pixelpad workflow (sponsored)", platform: "youtube", format: "Long video", status: "published", date: daysFromNow(-7), time: "17:00", dealId: "d-pixelpad", effort: 6 },
    { title: "Q&A: how I plan a month of content", platform: "instagram", format: "Reel", status: "scheduled", date: daysFromNow(5), time: "12:30", effort: 1.5 },
    { title: "Orbit 3 — 7-day verdict", platform: "youtube", format: "Long video", status: "idea", date: daysFromNow(14), dealId: "d-orbit", effort: 7 },
    { title: "Desk Notes #88", platform: "newsletter", format: "Newsletter", status: "idea", date: daysFromNow(8), time: "08:00", effort: 2 },
  ].map((o, i) => c(o as ContentItem, i));
}

export function seedThreads(): Thread[] {
  return [
    {
      id: "t-northstar",
      name: "Hannah Lee",
      initials: "NV",
      color: "#0f172a",
      org: "Northstar VPN",
      channel: "email",
      category: "deal",
      priority: "high",
      unread: true,
      subject: "Q4 partnership — 3 integrations?",
      summary: "Wants 3 YouTube integrations in Q4, asking for your rate card. Budget hinted at $8–10K.",
      dealSignal: { brand: "Northstar VPN", campaign: "Q4 YouTube integrations (x3)", estValue: 9000, platform: "youtube", category: "tech" },
      messages: [
        {
          id: "m1",
          from: "them",
          at: hoursAgo(3),
          text: "Hi Maya! I lead creator partnerships at Northstar. We loved your minimal desk tour — the bit about privacy screens was spot on.\n\nWe're planning Q4 and would love 3 YouTube integrations (60s each) across Oct–Dec. Our budget for this is roughly $8–10K total. Could you share your rate card and availability?\n\nBest,\nHannah",
        },
      ],
    },
    {
      id: "t-halcyon",
      name: "Andre Lewis",
      initials: "HV",
      color: "#4338ca",
      org: "Halcyon VR",
      channel: "email",
      category: "deal",
      priority: "high",
      unread: true,
      subject: "Re: Contract for First Hour in VR",
      summary: "Pushing you to sign by Friday. Contract has perpetual usage + net-90 terms — review before replying.",
      messages: [
        { id: "m1", from: "me", at: hoursAgo(50), text: "Hi Andre — excited about this one! Could you send over the contract when ready?" },
        {
          id: "m2",
          from: "them",
          at: hoursAgo(20),
          text: "Hey Maya, contract attached! It's our standard agreement so it should be quick. We need it signed by Friday to lock in the launch slot. Let me know!",
        },
      ],
    },
    {
      id: "t-zara",
      name: "Zara Malik",
      avatar: "pZara",
      channel: "instagram",
      category: "collab",
      priority: "medium",
      unread: true,
      subject: "Desk swap collab?",
      summary: "640K TikTok tech creator proposing a 'swap desks for a week' collab. 41% audience overlap.",
      messages: [
        {
          id: "m1",
          from: "them",
          at: hoursAgo(6),
          text: "omg Maya hiii 👋 big fan of your setups. wild idea: we swap desk setups for a week and both post our reactions? I think our audiences would love it. down to brainstorm?",
        },
      ],
    },
    {
      id: "t-scam",
      name: "Brand Collab Team",
      initials: "!",
      color: "#c13515",
      org: "Global Influencer Network",
      channel: "instagram",
      category: "spam",
      priority: "low",
      unread: true,
      subject: "Ambassador opportunity 💎",
      summary: "Classic ambassador scam: 'free' product if you pay shipping + asks for card details.",
      scamSignal: "Asks you to pay a 'shipping fee' and share card details for a 'free' ambassador product. 96% match with known scam patterns.",
      messages: [
        {
          id: "m1",
          from: "them",
          at: hoursAgo(9),
          text: "Congratulations!! 🎉 You've been selected as a GLOBAL AMBASSADOR for our luxury watch brand 💎 You get a FREE watch, just cover $29.99 shipping. Send your card details + address to claim before midnight!! ⏰",
        },
      ],
    },
    {
      id: "t-ledgerly",
      name: "Omar Siddiqui",
      initials: "L",
      color: "#15803d",
      org: "Ledgerly",
      channel: "email",
      category: "ops",
      priority: "high",
      unread: false,
      subject: "Re: Invoice INV-0142",
      summary: "Invoice INV-0142 ($3,200) is 9 days overdue. Last reply said 'sent to AP' 12 days ago.",
      messages: [
        { id: "m1", from: "me", at: hoursAgo(24 * 24), text: "Hi Omar — invoice INV-0142 for the tax explainer is attached. Thanks again, this was a fun one!" },
        { id: "m2", from: "them", at: hoursAgo(24 * 12), text: "Thanks Maya! Sent to our AP team, should be processed shortly." },
      ],
    },
    {
      id: "t-fan1",
      name: "Jordan P.",
      avatar: "pBen",
      channel: "youtube",
      category: "fan",
      priority: "low",
      unread: true,
      subject: "Comment on 'Minimal desk tour 2026'",
      summary: "Asking for the monitor-light model. Answer could be an affiliate link.",
      messages: [
        { id: "m1", from: "them", at: hoursAgo(2), text: "this is the cleanest setup I've ever seen. what monitor light is that?? need it" },
      ],
    },
    {
      id: "t-fan2",
      name: "Priyanka R.",
      avatar: "pPriya",
      channel: "tiktok",
      category: "fan",
      priority: "medium",
      unread: false,
      subject: "DM — career advice",
      summary: "UX student asking how you transitioned from design to full-time creator. Good newsletter topic.",
      messages: [
        {
          id: "m1",
          from: "them",
          at: hoursAgo(30),
          text: "Hi Maya! I'm a UX student and you're kind of my dream career lol. How did you know it was time to go full-time? Were you scared?",
        },
      ],
    },
    {
      id: "t-eli",
      name: "Eli Brooks",
      avatar: "pEli",
      channel: "x",
      category: "collab",
      priority: "medium",
      unread: false,
      subject: "Streaming setup build",
      summary: "Austin-based streamer (300K Twitch) wants to co-build a streaming setup. Local — easy to film.",
      messages: [
        { id: "m1", from: "them", at: hoursAgo(52), text: "yo! saw we're both in Austin. want to build a streaming setup together for both channels? I have the space, you have the taste 😅" },
      ],
    },
  ];
}

/** 12 months ending this month. */
export function seedEarnings(): MonthEarnings[] {
  const now = new Date();
  const base: Omit<MonthEarnings, "month">[] = [
    { deals: 6200, ads: 3100, affiliate: 900, members: 640, products: 0 },
    { deals: 4100, ads: 2950, affiliate: 1100, members: 680, products: 0 },
    { deals: 9800, ads: 3400, affiliate: 1250, members: 720, products: 0 },
    { deals: 3200, ads: 3600, affiliate: 980, members: 760, products: 1200 },
    { deals: 7400, ads: 3900, affiliate: 1400, members: 810, products: 900 },
    { deals: 12100, ads: 4200, affiliate: 1650, members: 860, products: 700 },
    { deals: 5600, ads: 4050, affiliate: 1500, members: 900, products: 650 },
    { deals: 8900, ads: 4400, affiliate: 1720, members: 940, products: 800 },
    { deals: 5800, ads: 4600, affiliate: 1880, members: 990, products: 720 },
    { deals: 9300, ads: 4900, affiliate: 2010, members: 1040, products: 1100 },
    { deals: 7700, ads: 5100, affiliate: 2150, members: 1090, products: 950 },
    { deals: 3900, ads: 2300, affiliate: 980, members: 1120, products: 400 },
  ];
  return base.map((b, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, ...b };
  });
}

export const POSTS: PostPerf[] = [
  { id: "p1", title: "Minimal desk tour 2026", platform: "youtube", format: "Long video", thumb: "deskWindow", views: 612_000, likes: 38_400, comments: 2_310, shares: 4_100, retention: 0.58, vsAvg: 4.1, daysAgo: 3, why: "Strong 3-second hook ('I deleted 80% of my desk') plus a satisfying before/after reveal at 0:42. Viewers who arrived from search for 'minimal desk' stayed 2× longer than browse traffic." },
  { id: "p2", title: "Monitor arm install in 60 seconds", platform: "tiktok", format: "Short", thumb: "macbookWood", views: 1_400_000, likes: 121_000, comments: 1_980, shares: 9_400, retention: 0.81, vsAvg: 14.6, daysAgo: 1, why: "Loopable ending and a single 'oddly satisfying' moment. 61% of views came from the For You page in Germany and the UK — a new audience pocket." },
  { id: "p3", title: "Keyboard ASMR, but productive", platform: "tiktok", format: "Short", thumb: "keyboard", views: 320_000, likes: 22_000, comments: 640, shares: 1_200, retention: 0.66, vsAvg: 3.3, daysAgo: 2, why: "Trending audio + caption question drove comments. Lower share rate than your desk content." },
  { id: "p4", title: "Pixelpad workflow (sponsored)", platform: "youtube", format: "Long video", thumb: "uiDesign", views: 186_000, likes: 9_800, comments: 540, shares: 610, retention: 0.49, vsAvg: 1.26, daysAgo: 7, why: "Sponsored, yet above average: the integration came at 2:10 after real value, and only 6% of viewers dropped during the ad read." },
  { id: "p5", title: "5 cables you're using wrong", platform: "instagram", format: "Carousel", thumb: "laptopDesk", views: 88_000, likes: 6_400, comments: 310, shares: 2_900, retention: 0.0, vsAvg: 2.1, daysAgo: 12, why: "Saves-driven: carousels with numbered tips get 3.4× more saves than your Reels." },
  { id: "p6", title: "What I'd tell myself in year one", platform: "linkedin", format: "Post", thumb: "laptopGlow", views: 41_000, likes: 1_900, comments: 260, shares: 140, retention: 0.0, vsAvg: 4.4, daysAgo: 9, why: "Personal story + specific numbers (first-year income) performs best on LinkedIn for you." },
];

/** Engagement heatmap: rows = Mon..Sun, cols = 6am..11pm buckets (3h). Values 0-1. */
export const BEST_TIMES: number[][] = [
  [0.2, 0.35, 0.4, 0.55, 0.8, 0.6],
  [0.25, 0.4, 0.45, 0.6, 0.85, 0.65],
  [0.2, 0.38, 0.5, 0.7, 0.95, 0.7],
  [0.22, 0.4, 0.48, 0.66, 0.9, 0.72],
  [0.18, 0.3, 0.42, 0.52, 0.7, 0.75],
  [0.3, 0.55, 0.62, 0.58, 0.6, 0.5],
  [0.35, 0.6, 0.7, 0.65, 0.72, 0.45],
];

/** Weekly follower totals (12 weeks) per platform for sparklines. */
export const FOLLOWER_TREND: Record<string, number[]> = {
  youtube: [371, 374, 378, 381, 385, 389, 392, 396, 400, 403, 408, 412].map((n) => n * 1000),
  tiktok: [462, 468, 471, 479, 486, 492, 499, 505, 510, 517, 525, 531].map((n) => n * 1000),
  instagram: [176, 177, 178, 179, 180, 181, 181, 182, 183, 184, 185, 186].map((n) => n * 1000),
  x: [46.9, 47, 47.1, 47.3, 47.4, 47.5, 47.6, 47.8, 47.9, 48, 48.1, 48.2].map((n) => n * 1000),
  linkedin: [18.2, 18.6, 19, 19.4, 19.8, 20.2, 20.6, 21, 21.4, 21.7, 22, 22.4].map((n) => n * 1000),
  newsletter: [28.4, 28.7, 29, 29.3, 29.6, 29.9, 30.2, 30.5, 30.9, 31.2, 31.5, 31.8].map((n) => n * 1000),
};
