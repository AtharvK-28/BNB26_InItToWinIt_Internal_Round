# CreatorAI — the operating system for creators

**Problem statement:** *Web/App Dev — CreatorAI: an AI-powered creator operating platform.*

CreatorAI puts an independent creator's whole business in one place — finding fairly paid brand deals, planning content without burning out, and handing the admin (pitches, contracts, invoices, inbox) to an AI that writes in the creator's voice. The interface follows Airbnb's design language: a white canvas, photo-first cards, one accent color, a pill search bar, and a split between **Explore** (Airbnb's guest mode) and **Studio** (Airbnb's hosting mode).

---

## 1. What we found (research)

| Pain point | Evidence |
|---|---|
| **Burnout is the norm** | 62% of full-time creators report burnout symptoms; 81% work 50+ hours a week ([The Creator Economy](https://thecreatoreconomy.com/post/creator-burnout-epidemic-mental-health-2026)) |
| **Income is unstable** | 68% of creators see month-to-month income swings of 30% or more; 54% have no emergency fund ([same source](https://thecreatoreconomy.com/post/creator-burnout-epidemic-mental-health-2026)) |
| **Brands pay late** | Net-60 terms plus approval delays can stretch to ~11 weeks between delivery and deposit; invoices get buried or sent to the wrong person ([Creators Agency](https://creatorsagency.co/blog/brand-deal-payment-terms-youtube-creators), [Creator Wizard](https://www.creatorwizard.com/post/brand-deal-payment-tips-late-payments-vendor-forms-tax-paperwork)) |
| **Contracts hide traps** | "Pay-when-paid" clauses shift the brand's collection risk onto the creator ([Odin Law](https://odinlaw.com/blog-why-most-creator-payment-disputes-are-lost-at-signing/)) |
| **Rates are guesswork** | Deals are moving to base fee + performance bonus; creators who can show their numbers earn more ([ThoughtLeaders](https://www.thoughtleaders.io/blog/creator-economy-trends-2026)) |
| **Today's tools are fragmented or extractive** | Link-in-bio/storefront tools like Beacons charge 9% on the free plan and score 1.9★ on Trustpilot ([TrakSource](https://traksource.com/beacons-ai-review/)); Notion templates and spreadsheets don't act on anything |
| **AI is already in the workflow** | 84% of creators use AI tools ([MGID](https://www.mgid.com/blog/creator-economy-how-ai-became-a-new-team-member)) — but in separate apps that don't know their deals, calendar or money |

**What existing tools get right (and we kept):** Stan/Beacons-style simplicity for one-person businesses, Notion-style "everything in one place," and Airbnb's trust mechanics — reviews, favorites and transparent pricing — which no creator marketplace applies to *brands*.

## 2. Our answer

| Problem | CreatorAI feature |
|---|---|
| Late payers, opaque brands | **Brand trust scores** — every brand shows its real payout speed and on-time rate, plus creator reviews on payment, freedom and fairness ("Creator favorite" badges, `Net-60 payer` warnings) |
| Underpricing | **Fair-rate engine** — expected views × niche CPM, adjusted for engagement, usage rights and exclusivity; every line of the math is shown, with a recommended counter |
| Risky contracts | **AI contract scanner** — flags Net-90, pay-when-paid, perpetual usage, broad exclusivity, unlimited revisions and missing kill fees, quotes the clause and writes the redline email |
| Chasing invoices | **Invoices + auto-reminders** whose tone escalates (friendly → firm with late fee → final notice) |
| Inbox overload & scams | **Unified inbox** (email, DMs, comments) sorted by AI, with summaries, 3 reply drafts in your voice, deal detection → one-click pipeline, and scam detection |
| Idea fatigue, posting everywhere | **Create studio** — ideas ranked for your audience, shoot-ready scripts with a natural sponsor slot, and one-click repurposing into TikTok, Reels/carousel, X thread, LinkedIn and newsletter |
| Burnout | **Workload-aware calendar** — planned hours vs. your stated capacity, overloaded days shaded, "Rebalance my week," and AI that fills gaps while keeping rest days free |
| Income swings | **Earnings** across 5 streams, a 3-month cash-flow forecast (pipeline weighted by stage), dip warnings, diversification and tax set-aside |
| Scattered stats | **Live media kit** — public page with verified stats, brand reviews, past results and an auto-calculated rate card |
| "What do I do today?" | **Today** — an AI daily brief and action cards, plus a copilot that answers questions about your actual deals, money and calendar |

## 3. Tour (3-minute demo script)

1. **Explore** (`/`) — Airbnb-style home: tabs (Brand deals · Collabs · Services), pill search, category strip, photo cards with ♥, "Creator favorite" badges and an AI fit score. Scroll to see the header compact into the small search pill.
2. Open **Lumen Audio** → listing page with photo mosaic, "Why this fits you", reviews broken down by payment speed and fairness, and the sticky card showing the **fair-rate check** (the offer is ~20% below fair). Click **Pitch with AI** → pick "Counter", tone → **Write my pitch** → **Send** — the deal lands in your pipeline.
3. **Studio → Today** (`/studio`) — the daily brief: chase an overdue invoice (**Review reminder** opens an AI-drafted email), send a draft, reply to a new inquiry. Below: workload vs. capacity with **Rebalance my week**.
4. **Deals** — drag cards across the Kanban. Open **Halcyon VR → Contract → Scan contract with AI** → 6 high-risk clauses with redlines → **Send redlines**.
5. **Inbox** — Northstar's inquiry with summary and reply chips; the scam DM is quarantined with an explanation.
6. **Create** — click a prompt chip for ideas → **Write script** → **Repurpose** with "Use my latest video".
7. **Ask CreatorAI** (bottom-right) — "How much am I owed?", "Should I sign the Halcyon contract?", "Am I overworking?"
8. **Earnings** and **Insights**, then the public **media kit** at `/c/mayamakes`, and **onboarding** at `/onboarding`.

All changes persist in the browser (localStorage). **Menu → Reset demo data** restores the original state.

## 4. AI architecture

```
Browser ──POST /api/ai {task, input}──▶ route handler ──▶ Claude (structured JSON via Zod schema)
        └─POST /api/ai/chat (streaming)─▶ route handler ──▶ Claude (streamed text, live workspace context)
                                              │
                                              └─ no key / error ─▶ local engine (same output shapes)
```

- **Model:** `claude-opus-5-5` via the official `@anthropic-ai/sdk`, effort `low` for snappy tasks (`medium` for contract review).
- **Structured outputs:** each task (`ideas`, `script`, `repurpose`, `pitch`, `reply`, `contract`, `reminder`, `counter`, `bio`) has a Zod schema in `src/lib/ai/schemas.ts`; Claude's output is constrained to it with `client.beta.messages.parse`.
- **Copilot:** streams over `client.beta.messages.stream`, grounded in a compact snapshot of the creator's deals, invoices, calendar, workload, earnings and unread inbox.
- **Refusal fallback:** requests opt into the API's server-side fallback (`fallbacks: "default"`), so a declined request is retried on Anthropic's recommended fallback model instead of failing.
- **Offline engine:** `src/lib/ai/local.ts` returns the same shapes with deterministic, input-aware templates and rules (the contract scanner and rate model are real logic, not canned text). The UI shows a small **Claude / Built-in AI** badge on every result so it's always clear which engine answered.

## 5. Running it

```bash
cd creatorai
npm install
npm run dev            # http://localhost:3000
```

Optional — use Claude for every AI feature:

```bash
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
```

Without a key everything still works on the built-in engine. Set `CREATORAI_AI=local` to force it even when a key is present.

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## 6. Design system (Airbnb-inspired)

- **Tokens** in `src/app/globals.css`: Rausch `#FF385C` used sparingly (search orb, primary CTA, hearts), ink `#222`, secondary `#6A6A6A`, hairlines `#DDDDDD/#EBEBEB`, card shadow `0 6px 16px rgba(0,0,0,.12)`, radii 8/12/16/full.
- **Type:** Figtree (an open-source stand-in for Airbnb Cereal), weight-only hierarchy.
- **Patterns recreated:** pill search with segmented dropdowns and a compact scrolled state, category strip with underline, photo carousels with hover arrows and dots, "Creator favorite" laurels, listing page with mosaic + sticky reserve card + section nav, host-style Today/Calendar/Messages/Earnings, "Become a host"-style onboarding with segmented progress bar, mobile bottom nav and stacked search sheet.
- **AI accent:** a Rausch → plum gradient (Airbnb Luxe/Plus colors) marks anything AI-generated.
- Charts follow a data-viz spec: ≤24px bars with rounded data-ends, 2px gaps in stacks, hairline grids, legends with values, hover tooltips, and a table view; the income-stream palette was validated for color-vision deficiency.

## 7. What's real vs. simulated

- **Real:** all UI and interactions, the fair-rate model, contract rules, workload model, forecast math, Claude integration, local persistence.
- **Simulated for the demo:** platform connections and stats, brands, campaigns, reviews, inbox messages and payments. **All brands and people are fictional.** Photos are from Unsplash (Unsplash License); photos showing real brand logos were excluded.

## 8. Project structure

```
src/
  app/
    page.tsx                  Explore (brand deals)
    deals/[id]/page.tsx       Deal listing page
    collabs/, services/       Explore tabs
    saved/                    Saved deals (wishlist)
    c/[handle]/               Public media kit
    onboarding/               Setup wizard
    studio/                   Today, create, calendar, deals, inbox, earnings, insights
    api/ai/                   AI tasks, streaming chat, engine status
  components/                 UI primitives, explore, deal, studio, charts
  lib/
    ai/                       Claude client, prompts, schemas, local engine, client helpers
    logic/                    rate, contract, wellbeing, forecast
    data/                     Seed data (fictional)
    store.ts                  Zustand store (persisted)
```
