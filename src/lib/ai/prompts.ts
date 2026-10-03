import type {
  BioInput,
  ClipsInput,
  ContractInput,
  CopilotContext,
  CounterInput,
  CreatorBrief,
  DmInput,
  FeedbackInput,
  IdeasInput,
  PitchInput,
  ReminderInput,
  ReplyInput,
  ReportInput,
  RepurposeInput,
  ScriptInput,
  TitlesInput,
} from "./schemas";

const fmt = (n: number) => n.toLocaleString("en-US");

export function creatorBlock(c: CreatorBrief) {
  return `<creator>
Name: ${c.name} (@${c.handle})
Niches: ${c.niches.join(", ")}
Voice: ${c.voice.join("; ")}
Bio: ${c.bio}
Platforms:
${c.platforms.map((p) => `- ${p.platform}: ${fmt(p.followers)} followers, ~${fmt(p.avgViews)} avg views, ${(p.engagement * 100).toFixed(1)}% engagement`).join("\n")}
</creator>`;
}

export const PROMPTS = {
  ideas: (i: IdeasInput) => ({
    instructions:
      "Generate exactly 6 content ideas tailored to this creator's niche, voice and audience. Mix formats unless a platform is specified. Hooks must be specific and scroll-stopping. Scores should vary realistically (55-96).",
    user: `${creatorBlock(i.creator)}
Platform focus: ${i.platform}
What the creator wants: ${i.prompt || "Surprise me with what will work this week"}
Recent posts (avoid repeating): ${i.recent.join(" | ")}`,
  }),
  script: (i: ScriptInput) => ({
    instructions:
      "Write a production-ready script outline for this idea: a 5-second hook, 4-6 sections with timestamped headings and 2-4 beats each, B-roll notes, a CTA and 3 thumbnail text ideas (max 4 words each). If there is a sponsor, place a natural integration after the first value section, not at the start.",
    user: `${creatorBlock(i.creator)}
Platform: ${i.platform}
Idea: ${i.idea}
${i.sponsor ? `Sponsor to integrate: ${i.sponsor}` : "No sponsor."}`,
  }),
  repurpose: (i: RepurposeInput) => ({
    instructions:
      "Repurpose the source into native, ready-to-post content for each requested platform — one output per platform, in the same order. Respect each platform's norms (TikTok/Shorts: spoken script with on-screen text cues; Instagram: carousel slides + caption; X: numbered thread; LinkedIn: story-driven post with short lines; Newsletter: subject line + section). Keep the creator's voice.",
    user: `${creatorBlock(i.creator)}
Platforms: ${i.platforms.join(", ")}
<source>
${i.source}
</source>`,
  }),
  pitch: (i: PitchInput) => ({
    instructions:
      "Write a short, confident brand pitch email from the creator. Open with a specific reason this brand fits, propose one concrete creative concept, cite 2-3 real stats from the creator context, state the rate and terms clearly (Net-15, 30-day organic usage), and end with an easy yes. Under 180 words. No placeholders.",
    user: `${creatorBlock(i.creator)}
Brand: ${i.brand} (contact: ${i.manager})
Campaign: ${i.campaign}
Brief: ${i.description}
Deliverables: ${i.deliverables.join("; ")}
Why the creator fits: ${i.fitReasons.join("; ")}
Brand's offer: $${fmt(i.offer)}. Creator's rate to propose: $${fmt(i.amount)}.
Tone: ${i.tone}`,
  }),
  reply: (i: ReplyInput) => ({
    instructions:
      "Draft exactly 3 distinct reply options the creator could send to this thread (e.g. accept / ask a question / decline politely). Match the channel's register (DMs are casual, emails are professional). If the thread looks like a scam, make every option a safe non-engagement or a report note. Keep each under 90 words.",
    user: `${creatorBlock(i.creator)}
From: ${i.name}${i.org ? ` (${i.org})` : ""}
Category: ${i.category} (deal = brand partnership inquiry, collab = creator collaboration, fan = community message, ops = admin/payments, spam = likely scam)
${i.rateHint ? `Creator's fair rate for a standard integration: $${fmt(i.rateHint)}` : ""}
Thread:
${i.messages.map((m) => `${m.from === "me" ? "Creator" : i.name}: ${m.text}`).join("\n\n")}`,
  }),
  contract: (i: ContractInput) => ({
    instructions:
      "You are reviewing a brand partnership contract on behalf of the creator (not legal advice). Flag every clause that is bad for the creator: payment terms over Net-30, pay-when-paid, perpetual or paid usage without extra pay, broad or long exclusivity, unlimited revisions, termination without payment, vague morality clauses, missing kill fee, missing late fee. Quote clauses exactly. Order flags by severity. If the contract is good, say so and return few or no flags.",
    user: `<contract>\n${i.text}\n</contract>`,
  }),
  reminder: (i: ReminderInput) => ({
    instructions: `Write a payment reminder email from the creator. Tone escalates with reminders already sent: 0 = friendly nudge, 1 = firm and mentions the ${i.lateFeePct}% monthly late fee from the contract, 2+ = final notice before escalation. Include invoice number, amount and original due date. Under 120 words.`,
    user: `${creatorBlock(i.creator)}
Brand: ${i.brand}, contact: ${i.contact}
Invoice ${i.invoiceNumber}: $${fmt(i.amount)}, due ${i.dueDate}, ${i.daysOverdue} days overdue
Reminders already sent: ${i.remindersSent}`,
  }),
  counter: (i: CounterInput) => ({
    instructions:
      "Write a warm but firm negotiation email countering the brand's offer. Anchor on data, propose the counter number, list the term changes as short bullets, and keep the door open (offer an alternative scope if the budget is fixed). Under 170 words.",
    user: `${creatorBlock(i.creator)}
Brand: ${i.brand}, contact: ${i.contact}
Campaign: ${i.campaign}
Their offer: $${fmt(i.offer)}. Counter: $${fmt(i.counter)}.
Data points: ${i.reasons.join("; ")}
Term changes requested: ${i.termChanges.length ? i.termChanges.join("; ") : "none"}`,
  }),
  bio: (i: BioInput) => ({
    instructions:
      "Write a media-kit 'About' paragraph in third person for brand partners: 3 sentences, specific numbers, what the audience trusts this creator for, and the kind of partnerships that perform best.",
    user: `${creatorBlock(i.creator)}\nAudience: ${i.audience}`,
  }),
  titles: (i: TitlesInput) => ({
    instructions:
      "Write exactly 6 YouTube title + thumbnail-text packages for this video, each using a different angle (curiosity gap, number/specificity, contrarian, challenge, personal story, comparison). Thumbnail text must add information the title doesn't repeat. Vary the scores realistically. YouTube's Test & Compare picks winners by watch time, so avoid clickbait the video can't pay off.",
    user: `${creatorBlock(i.creator)}\nVideo topic / working title: ${i.topic}`,
  }),
  clips: (i: ClipsInput) => ({
    instructions:
      "Find the 3-5 best self-contained short-form clips (20-60 seconds) in this transcript. Assume speech at ~155 words per minute to estimate start/end seconds from word position. Score virality 1-100 from hook strength in the first 3 seconds, a clear payoff, specificity (numbers) and emotional contrast. Clips must not overlap. If a search query is given, only return moments that match it.",
    user: `${creatorBlock(i.creator)}\n${i.query ? `Search: ${i.query}\n` : ""}<transcript>\n${i.transcript}\n</transcript>`,
  }),
  feedback: (i: FeedbackInput) => ({
    instructions: `Reply to the brand's feedback on a sponsored draft, as the creator. Warmly confirm every in-scope change and when the revised cut will arrive. For out-of-scope requests (new deliverables or products not in the agreement), don't refuse — say it's outside the agreed scope and offer it as an add-on for $${i.extraFee.toLocaleString("en-US")}, or as a separate Short. Mention revision rounds used (${i.roundsUsed + 1} of ${i.roundsIncluded} after this one). Under 150 words.`,
    user: `${creatorBlock(i.creator)}\nBrand: ${i.brand}, contact: ${i.contact}\nComments:\n${i.comments.map((c) => `- [${c.at}] (${c.scope}) ${c.text}`).join("\n")}`,
  }),
  report: (i: ReportInput) => ({
    instructions:
      "Write a short post-campaign performance report for the brand, from the creator. Lead with the standout result, compare against typical benchmarks only in general terms, list 3-4 crisp highlights, and propose a natural follow-up campaign.",
    user: `${creatorBlock(i.creator)}\nBrand: ${i.brand}\nCampaign: ${i.campaign}\nMetrics: ${JSON.stringify(i.metrics)}${i.bonus ? `\nBonus status: ${i.bonus}` : ""}`,
  }),
  dm: (i: DmInput) => ({
    instructions:
      "Design a comment-to-DM automation for this post: pick one short uppercase keyword followers will comment, and write the auto-DM (friendly, in the creator's voice, under 280 characters, with a {link} placeholder).",
    user: `${creatorBlock(i.creator)}\nPost: ${i.post}\nGoal: ${i.goal}`,
  }),
};

export function copilotSystem(ctx: CopilotContext) {
  return `You are the creator's in-app copilot. Answer using the live workspace data below. Be concise: short paragraphs or tight bullet lists, bold the key numbers, and end with one suggested next step when useful. Use markdown (bold, bullets) but no headings or tables.
If asked to draft something (email, caption, script), draft it fully in the creator's voice.
Today is ${ctx.today}.

${creatorBlock(ctx.creator)}

<deals>
${ctx.deals.map((d) => `- ${d.brand} — ${d.campaign}: stage=${d.stage}, $${fmt(d.value)}, due ${d.dueDate}, Net-${d.paymentTerms}${d.invoice ? `, invoice ${d.invoice.number} ${d.invoice.status} (due ${d.invoice.due})` : ""}${d.contractRisk ? `, contract risk: ${d.contractRisk}` : ""}`).join("\n")}
</deals>

<upcoming_content next_7_days>
${ctx.upcoming.map((u) => `- ${u.date}: ${u.title} [${u.platform}, ${u.status}, ~${u.effort}h]`).join("\n")}
</upcoming_content>

<workload>Planned ${ctx.workload.hours.toFixed(1)}h of ${ctx.workload.capacity}h weekly capacity (${ctx.workload.status}); rest days this week: ${ctx.workload.restDays}${ctx.workload.busiestDay ? `; busiest day ${ctx.workload.busiestDay}` : ""}</workload>

<earnings>YTD $${fmt(ctx.earnings.ytd)}; this month so far $${fmt(ctx.earnings.thisMonth)}; last month $${fmt(ctx.earnings.lastMonth)}; largest stream ${ctx.earnings.topStream} (${Math.round(ctx.earnings.topStreamShare * 100)}%)</earnings>

<unread_inbox>
${ctx.unreadInbox.map((m) => `- ${m.name} [${m.category}]: ${m.summary}`).join("\n")}
</unread_inbox>

<packages bookable by brands>
${(ctx.packages ?? []).map((p) => `- ${p.title}: $${fmt(p.price)} ${p.instantBook ? "(Instant Book)" : "(request to book)"}, ${p.booked}`).join("\n")}
</packages>

<pending_booking_requests respond within 24h>
${(ctx.bookingRequests ?? []).map((b) => `- ${b.brand} wants "${b.package}" for $${fmt(b.price)} — ${b.hoursLeft}h left to respond`).join("\n") || "none"}
</pending_booking_requests>

<draft_reviews>
${(ctx.reviews ?? []).map((r) => `- ${r.brand}: ${r.status}, revision rounds ${r.roundsUsed}/${r.roundsIncluded}; open notes: ${r.openComments.join(" | ")}`).join("\n") || "none"}
</draft_reviews>`;
}
