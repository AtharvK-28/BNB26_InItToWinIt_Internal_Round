"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CREATOR } from "./data/creator";
import { seedAbTests, seedAutomations, seedBookings, seedExpenses, seedPackages, seedQuickReplies } from "./data/growth";
import { seedContent, seedDeals, seedEarnings, seedThreads } from "./data/studio";
import type {
  AbTest,
  Automation,
  BookingRequest,
  Campaign,
  ContentItem,
  CreatorProfile,
  Deal,
  DealStage,
  Expense,
  ImportedPost,
  MonthEarnings,
  Package,
  QuickReply,
  Thread,
} from "./types";
import { daysFromNow, toISODate, today, uid } from "./utils";

export interface AppState {
  onboarded: boolean;
  profile: CreatorProfile;
  saved: string[];
  deals: Deal[];
  content: ContentItem[];
  threads: Thread[];
  earnings: MonthEarnings[];
  packages: Package[];
  bookings: BookingRequest[];
  automations: Automation[];
  quickReplies: QuickReply[];
  abTests: AbTest[];
  expenses: Expense[];
  taxPaid: string[];
  taxRate: number;
  /** The creator's own post stats, imported from a CSV; empty means Insights shows sample data. */
  postStats: ImportedPost[];
  setPostStats: (posts: ImportedPost[]) => void;

  savePackage: (p: Package) => void;
  removePackage: (id: string) => void;
  requestBooking: (b: Omit<BookingRequest, "id" | "createdAt" | "status">) => { id: string; dealId?: string };
  respondBooking: (id: string, accept: boolean) => string | undefined;
  releaseEscrow: (dealId: string) => void;

  resolveComment: (dealId: string, commentId: string) => void;
  submitRevision: (dealId: string) => void;
  approveDraft: (dealId: string) => void;
  claimBonus: (dealId: string) => void;

  toggleAutomation: (id: string) => void;
  saveAutomation: (a: Automation) => void;
  startAbTest: (t: Omit<AbTest, "id">) => void;
  toggleTaxPaid: (id: string) => void;
  setTaxRate: (r: number) => void;
  toggleExpense: (id: string) => void;

  toggleSave: (campaignId: string) => void;
  pitchCampaign: (c: Campaign, opts: { amount: number; pitch: string }) => string;
  addDeal: (d: Deal) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  toggleDeliverable: (dealId: string, deliverableId: string) => void;
  sendInvoice: (dealId: string) => void;
  sendReminder: (dealId: string, text: string) => void;
  markPaid: (dealId: string) => void;

  addContent: (item: Omit<ContentItem, "id">) => string;
  updateContent: (id: string, patch: Partial<ContentItem>) => void;
  removeContent: (id: string) => void;

  markThreadRead: (id: string) => void;
  sendMessage: (threadId: string, text: string) => void;
  convertThread: (threadId: string) => string | undefined;

  completeOnboarding: (patch: Partial<CreatorProfile>) => void;
  reset: () => void;
}

const fresh = () => ({
  onboarded: false,
  profile: CREATOR,
  saved: ["halo-desk", "brightpath"],
  deals: seedDeals(),
  content: seedContent(),
  threads: seedThreads(),
  earnings: seedEarnings(),
  packages: seedPackages(),
  bookings: seedBookings(),
  automations: seedAutomations(),
  quickReplies: seedQuickReplies(),
  abTests: seedAbTests(),
  expenses: seedExpenses(),
  // Quarters whose IRS due date has already passed this year start as paid.
  taxPaid: [
    [3, "q1"],
    [5, "q2"],
    [8, "q3"],
  ]
    .filter(([m]) => new Date(new Date().getFullYear(), m as number, 15) < new Date())
    .map(([, q]) => `${new Date().getFullYear()}-${q}`),
  taxRate: 0.28,
  postStats: [] as ImportedPost[],
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...fresh(),

      toggleSave: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),

      pitchCampaign: (c, { amount, pitch }) => {
        const existing = get().deals.find((d) => d.campaignId === c.id && d.stage !== "paid");
        if (existing) {
          get().updateDeal(existing.id, { value: amount, pitch, stage: existing.stage === "inbound" ? "pitched" : existing.stage });
          return existing.id;
        }
        const id = uid("d");
        const deal: Deal = {
          id,
          brand: c.brand,
          brandInitials: c.brandInitials,
          brandColor: c.brandColor,
          campaign: c.title,
          campaignId: c.id,
          category: c.category,
          value: amount,
          bonus: c.bonus || undefined,
          stage: "pitched",
          platform: c.platforms[0],
          deliverables: c.deliverables.map((d, i) => ({ id: `x${i}`, label: `${d.qty > 1 ? `${d.qty} × ` : ""}${d.label}`, done: false })),
          dueDate: daysFromNow(c.goLiveDays - 5),
          goLive: daysFromNow(c.goLiveDays),
          paymentTerms: c.paymentDays,
          contact: { name: `${c.manager.name}`, email: `${c.manager.name.toLowerCase()}@${c.brand.toLowerCase().replace(/[^a-z]/g, "")}.example` },
          source: "marketplace",
          createdAt: toISODate(today()),
          pitch,
        };
        set((s) => ({ deals: [deal, ...s.deals] }));
        return id;
      },

      addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),

      moveDeal: (id, stage) =>
        set((s) => ({
          deals: s.deals.map((d) => {
            if (d.id !== id) return d;
            const next: Deal = { ...d, stage };
            if (stage === "invoiced" && !d.invoice && !d.escrow) {
              next.invoice = {
                number: `INV-${String(146 + s.deals.filter((x) => x.invoice).length).padStart(4, "0")}`,
                issued: toISODate(today()),
                due: daysFromNow(d.paymentTerms),
                status: "sent",
                remindersSent: 0,
                lateFeePct: 1.5,
              };
            }
            if (stage === "paid" && d.invoice) next.invoice = { ...d.invoice, status: "paid", paidOn: toISODate(today()) };
            return next;
          }),
        })),

      updateDeal: (id, patch) => set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      toggleDeliverable: (dealId, did) =>
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, deliverables: d.deliverables.map((x) => (x.id === did ? { ...x, done: !x.done } : x)) } : d,
          ),
        })),

      sendInvoice: (dealId) => get().moveDeal(dealId, "invoiced"),

      sendReminder: (dealId, text) => {
        const deal = get().deals.find((d) => d.id === dealId);
        if (!deal?.invoice) return;
        get().updateDeal(dealId, { invoice: { ...deal.invoice, remindersSent: deal.invoice.remindersSent + 1 } });
        const thread = get().threads.find((t) => t.org === deal.brand);
        if (thread) get().sendMessage(thread.id, text);
      },

      markPaid: (dealId) => {
        const deal = get().deals.find((d) => d.id === dealId);
        if (!deal) return;
        get().moveDeal(dealId, "paid");
        set((s) => {
          const earnings = [...s.earnings];
          const last = { ...earnings[earnings.length - 1] };
          last.deals += deal.value;
          earnings[earnings.length - 1] = last;
          return { earnings };
        });
      },

      addContent: (item) => {
        const id = uid("ct");
        set((s) => ({ content: [...s.content, { ...item, id }] }));
        return id;
      },
      updateContent: (id, patch) => set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeContent: (id) => set((s) => ({ content: s.content.filter((c) => c.id !== id) })),

      markThreadRead: (id) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, unread: false } : t)) })),

      sendMessage: (threadId, text) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, unread: false, messages: [...t.messages, { id: uid("m"), from: "me", text, at: new Date().toISOString() }] }
              : t,
          ),
        })),

      convertThread: (threadId) => {
        const t = get().threads.find((x) => x.id === threadId);
        if (!t?.dealSignal) return;
        const existing = get().deals.find((d) => d.brand === t.dealSignal!.brand && d.stage !== "paid");
        set((s) => ({ threads: s.threads.map((x) => (x.id === threadId ? { ...x, converted: true } : x)) }));
        if (existing) return existing.id;
        const id = uid("d");
        get().addDeal({
          id,
          brand: t.dealSignal.brand,
          brandInitials: t.initials ?? t.dealSignal.brand.slice(0, 2).toUpperCase(),
          brandColor: t.color ?? "#222",
          campaign: t.dealSignal.campaign,
          category: t.dealSignal.category,
          value: t.dealSignal.estValue,
          stage: "inbound",
          platform: t.dealSignal.platform,
          deliverables: [{ id: "x1", label: t.dealSignal.campaign, done: false }],
          dueDate: daysFromNow(30),
          paymentTerms: 30,
          contact: { name: t.name, email: `${t.name.split(" ")[0].toLowerCase()}@example.com` },
          source: "inbox",
          createdAt: toISODate(today()),
        });
        return id;
      },

      completeOnboarding: (patch) => set((s) => ({ onboarded: true, profile: { ...s.profile, ...patch } })),

      /* ---------- Packages & bookings ---------- */

      savePackage: (p) =>
        set((s) => ({ packages: s.packages.some((x) => x.id === p.id) ? s.packages.map((x) => (x.id === p.id ? p : x)) : [...s.packages, p] })),
      removePackage: (id) => set((s) => ({ packages: s.packages.filter((p) => p.id !== id) })),

      requestBooking: (b) => {
        const id = uid("bk");
        const booking: BookingRequest = { ...b, id, createdAt: new Date().toISOString(), status: b.instant ? "accepted" : "pending" };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        if (!b.instant) return { id };
        return { id, dealId: get().respondBooking(id, true) };
      },

      respondBooking: (id, accept) => {
        const b = get().bookings.find((x) => x.id === id);
        if (!b) return;
        set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: accept ? "accepted" : "declined" } : x)) }));
        if (!accept) return;
        const pkg = get().packages.find((p) => p.id === b.packageId);
        const dealId = uid("d");
        get().addDeal({
          id: dealId,
          brand: b.brand,
          brandInitials: b.brandInitials,
          brandColor: b.brandColor,
          campaign: pkg?.title ?? "Package booking",
          category: pkg?.category ?? "tech",
          value: b.price,
          stage: "contracted",
          platform: pkg?.deliverables[0]?.platform ?? "youtube",
          deliverables: (pkg?.deliverables ?? []).map((d, i) => ({ id: `x${i}`, label: `${d.qty > 1 ? `${d.qty} × ` : ""}${d.label}`, done: false })),
          dueDate: daysFromNow(Math.max(3, Math.round((new Date(b.goLive).getTime() - Date.now()) / 86_400_000) - 3)),
          goLive: b.goLive,
          paymentTerms: 0,
          contact: { name: b.contact, email: `${b.contact.split(" ")[0].toLowerCase()}@${b.brand.toLowerCase().replace(/[^a-z]/g, "")}.example` },
          source: "package",
          packageId: b.packageId,
          createdAt: toISODate(today()),
          escrow: { amount: b.price, status: "funded", fundedOn: toISODate(today()), autoReleaseDays: 5 },
          notes: b.brief,
        });
        if (pkg) get().savePackage({ ...pkg, bookedThisMonth: pkg.bookedThisMonth + 1 });
        return dealId;
      },

      releaseEscrow: (dealId) => {
        const d = get().deals.find((x) => x.id === dealId);
        if (!d?.escrow) return;
        get().updateDeal(dealId, { escrow: { ...d.escrow, status: "released" } });
        get().markPaid(dealId);
      },

      /* ---------- Draft review & reporting ---------- */

      resolveComment: (dealId, cid) => {
        const d = get().deals.find((x) => x.id === dealId);
        if (!d?.review) return;
        get().updateDeal(dealId, { review: { ...d.review, comments: d.review.comments.map((c) => (c.id === cid ? { ...c, resolved: !c.resolved } : c)) } });
      },
      submitRevision: (dealId) => {
        const d = get().deals.find((x) => x.id === dealId);
        if (!d?.review) return;
        get().updateDeal(dealId, {
          review: { ...d.review, version: d.review.version + 1, roundsUsed: d.review.roundsUsed + 1, status: "awaiting", submittedAt: new Date().toISOString(), comments: [] },
        });
      },
      approveDraft: (dealId) => {
        const d = get().deals.find((x) => x.id === dealId);
        if (!d?.review) return;
        get().updateDeal(dealId, {
          review: { ...d.review, status: "approved" },
          deliverables: d.deliverables.map((x) => (/draft|review/i.test(x.label) ? { ...x, done: true } : x)),
        });
      },
      claimBonus: (dealId) => {
        const d = get().deals.find((x) => x.id === dealId);
        const bt = d?.report?.bonusTarget;
        if (!d?.report || !bt || bt.claimed) return;
        get().updateDeal(dealId, { value: d.value + bt.amount, report: { ...d.report, bonusTarget: { ...bt, claimed: true } } });
      },

      /* ---------- Automations, tests, money ---------- */

      toggleAutomation: (id) => set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, on: !a.on } : a)) })),
      saveAutomation: (a) =>
        set((s) => ({ automations: s.automations.some((x) => x.id === a.id) ? s.automations.map((x) => (x.id === a.id ? a : x)) : [a, ...s.automations] })),
      startAbTest: (t) => set((s) => ({ abTests: [{ ...t, id: uid("ab") }, ...s.abTests] })),
      toggleTaxPaid: (id) => set((s) => ({ taxPaid: s.taxPaid.includes(id) ? s.taxPaid.filter((x) => x !== id) : [...s.taxPaid, id] })),
      setTaxRate: (r) => set({ taxRate: r }),
      setPostStats: (posts) => set({ postStats: posts }),
      toggleExpense: (id) => set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, deductible: !e.deductible } : e)) })),

      reset: () => set({ ...fresh() }),
    }),
    {
      name: "creatorai-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // v2 added packages, bookings, reviews and more — older demo data is replaced with the new seed.
      migrate: (persisted, version) => (version < 2 ? (fresh() as unknown as AppState) : (persisted as AppState)),
    },
  ),
);

/* ---------------- Ephemeral UI state ---------------- */

export interface Toast {
  id: string;
  text: string;
  action?: { label: string; href: string };
}

interface UiState {
  hydrated: boolean;
  toasts: Toast[];
  copilotOpen: boolean;
  copilotPrompt?: string;
  showFit: boolean;
  setShowFit: (v: boolean) => void;
  setHydrated: () => void;
  toast: (text: string, action?: Toast["action"]) => void;
  dismiss: (id: string) => void;
  openCopilot: (prompt?: string) => void;
  closeCopilot: () => void;
}

export const useUi = create<UiState>()((set, get) => ({
  hydrated: false,
  toasts: [],
  copilotOpen: false,
  showFit: true,
  setShowFit: (v) => set({ showFit: v }),
  setHydrated: () => set({ hydrated: true }),
  toast: (text, action) => {
    const id = uid("t");
    set((s) => ({ toasts: [...s.toasts, { id, text, action }] }));
    setTimeout(() => get().dismiss(id), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openCopilot: (prompt) => set({ copilotOpen: true, copilotPrompt: prompt }),
  closeCopilot: () => set({ copilotOpen: false, copilotPrompt: undefined }),
}));
