"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CircleAlert, Kanban, List, Plus, ShieldAlert } from "lucide-react";
import { DealSheet, type DealTab } from "@/components/studio/deals/DealSheet";
import { PageTitle, StudioPage } from "@/components/studio/Shell";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { BrandLogo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { STAGES, PLATFORMS } from "@/lib/data/meta";
import { useApp, useUi } from "@/lib/store";
import type { Deal, DealStage, Platform } from "@/lib/types";
import { cn, daysFromNow, daysUntil, money, relDay, toISODate, today, uid } from "@/lib/utils";

export default function DealsPage() {
  return (
    <StudioPage wide>
      <Suspense>
        <Deals />
      </Suspense>
    </StudioPage>
  );
}

function Deals() {
  const router = useRouter();
  const params = useSearchParams();
  const deals = useApp((s) => s.deals);
  const moveDeal = useApp((s) => s.moveDeal);
  const toast = useUi((s) => s.toast);
  const [view, setView] = useState<"board" | "list">("board");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [creating, setCreating] = useState(false);
  const openId = params.get("open");
  const openTab = (params.get("tab") as DealTab) ?? "overview";

  const open = (id: string, tab?: DealTab) => router.push(`/studio/deals?open=${id}${tab ? `&tab=${tab}` : ""}`, { scroll: false });
  const close = () => router.push("/studio/deals", { scroll: false });

  const active = deals.filter((d) => d.stage !== "paid");
  const pipelineValue = deals.filter((d) => !["invoiced", "paid"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const awaiting = deals.filter((d) => d.stage === "invoiced").reduce((s, d) => s + d.value, 0);
  const paid = deals.filter((d) => d.stage === "paid").reduce((s, d) => s + d.value, 0);
  const paidDeals = deals.filter((d) => d.invoice?.paidOn);
  const avgDays = paidDeals.length
    ? Math.round(paidDeals.reduce((s, d) => s + (new Date(d.invoice!.paidOn!).getTime() - new Date(d.invoice!.issued).getTime()) / 86_400_000, 0) / paidDeals.length)
    : 0;

  return (
    <>
      <PageTitle
        title="Deals"
        sub={`${active.length} active deals · drag cards between stages`}
        right={
          <div className="flex items-center gap-3">
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { id: "board", label: <span className="inline-flex items-center gap-1.5"><Kanban className="size-4" />Board</span> },
                { id: "list", label: <span className="inline-flex items-center gap-1.5"><List className="size-4" />List</span> },
              ]}
            />
            <Button variant="dark" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New deal
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open pipeline" value={money(pipelineValue)} />
        <Stat label="Awaiting payment" value={money(awaiting)} />
        <Stat label="Paid (last 90 days)" value={money(paid)} />
        <Stat label="Avg. days to get paid" value={`${avgDays} days`} />
      </div>

      {view === "board" ? (
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-6 md:-mx-6 md:px-6 lg:-mx-10 lg:px-10 xl:-mx-20 xl:px-20">
          {STAGES.map((s) => {
            const items = deals.filter((d) => d.stage === s.id);
            const sum = items.reduce((a, d) => a + d.value, 0);
            return (
              <div
                key={s.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(s.id);
                }}
                onDragLeave={() => setOverStage((o) => (o === s.id ? null : o))}
                onDrop={() => {
                  if (dragId) {
                    const d = deals.find((x) => x.id === dragId);
                    if (d && d.stage !== s.id) {
                      moveDeal(dragId, s.id);
                      toast(`${d.brand} moved to ${s.label}${s.id === "invoiced" ? " — invoice created" : ""}.`);
                    }
                  }
                  setDragId(null);
                  setOverStage(null);
                }}
                className={cn("flex w-[290px] shrink-0 flex-col rounded-2xl p-2 transition-colors", overStage === s.id ? "bg-rausch-soft" : "bg-surface")}
              >
                <div className="flex items-baseline justify-between px-2 pt-2 pb-3">
                  <h3 className="text-sm font-semibold">
                    {s.label} <span className="font-normal text-ink-2">{items.length}</span>
                  </h3>
                  <span className="text-xs text-ink-2">{sum ? money(sum, { compact: true }) : ""}</span>
                </div>
                <div className="flex min-h-24 flex-col gap-2">
                  {items.map((d) => (
                    <DealCard key={d.id} d={d} onOpen={() => open(d.id)} onDragStart={() => setDragId(d.id)} dragging={dragId === d.id} />
                  ))}
                  {!items.length && <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-3">{s.hint}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line-soft">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-left text-xs text-ink-2">
              <tr>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 text-right font-medium">Value</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Terms</th>
                <th className="px-5 py-3 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {deals.map((d) => (
                <tr key={d.id} onClick={() => open(d.id)} className="cursor-pointer hover:bg-surface">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <BrandLogo initials={d.brandInitials} color={d.brandColor} size={32} className="rounded-lg!" />
                      <div>
                        <div className="font-semibold">{d.brand}</div>
                        <div className="text-xs text-ink-2">{d.campaign}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{STAGES.find((s) => s.id === d.stage)?.label}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{money(d.value)}</td>
                  <td className="px-5 py-3">{relDay(d.dueDate)}</td>
                  <td className="px-5 py-3">Net-{d.paymentTerms}</td>
                  <td className="px-5 py-3">
                    <Flags d={d} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DealSheet key={`${openId}-${openTab}`} id={openId} initialTab={openTab} onClose={close} />
      <NewDealModal open={creating} onClose={() => setCreating(false)} onCreated={(id) => open(id)} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line-soft p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Flags({ d }: { d: Deal }) {
  const overdue = d.invoice && d.invoice.status !== "paid" && daysUntil(d.invoice.due) < 0;
  const risky = d.contractText && /perpetual|ninety/i.test(d.contractText);
  return (
    <div className="flex flex-wrap gap-1">
      {overdue && (
        <span className="inline-flex items-center gap-1 rounded-full bg-arches-soft px-2 py-0.5 text-[11px] font-semibold text-arches">
          <CircleAlert className="size-3" /> Overdue
        </span>
      )}
      {risky && (
        <span className="inline-flex items-center gap-1 rounded-full bg-arches-soft px-2 py-0.5 text-[11px] font-semibold text-arches">
          <ShieldAlert className="size-3" /> Risky contract
        </span>
      )}
      {d.paymentTerms > 30 && !risky && <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber">Net-{d.paymentTerms}</span>}
      {d.source === "inbox" && d.stage === "inbound" && <span className="rounded-full bg-babu-soft px-2 py-0.5 text-[11px] font-semibold text-babu">From inbox</span>}
    </div>
  );
}

function DealCard({ d, onOpen, onDragStart, dragging }: { d: Deal; onOpen: () => void; onDragStart: () => void; dragging: boolean }) {
  const done = d.deliverables.filter((x) => x.done).length;
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onClick={onOpen}
      className={cn(
        "w-full cursor-grab rounded-xl border border-line-soft bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-card active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <BrandLogo initials={d.brandInitials} color={d.brandColor} size={36} className="rounded-lg!" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{d.brand}</div>
          <div className="line-clamp-2 text-xs text-ink-2">{d.campaign}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold">{money(d.value)}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
          <PlatformGlyph platform={d.platform} size={12} />
          {d.stage === "paid" ? "Paid" : relDay(d.invoice && d.stage === "invoiced" ? d.invoice.due : d.dueDate)}
        </span>
      </div>
      {d.stage === "production" && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-line-soft">
          <div className="h-full rounded-full bg-ink" style={{ width: `${(done / d.deliverables.length) * 100}%` }} />
        </div>
      )}
      <div className="mt-2 empty:hidden">
        <Flags d={d} />
      </div>
    </button>
  );
}

function NewDealModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const addDeal = useApp((s) => s.addDeal);
  const [brand, setBrand] = useState("");
  const [campaign, setCampaign] = useState("");
  const [value, setValue] = useState(3000);
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [terms, setTerms] = useState(30);
  const input = "w-full rounded-lg border border-[#b0b0b0] px-3 py-3 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New deal"
      footer={
        <div className="flex justify-end">
          <Button
            variant="dark"
            disabled={!brand.trim() || !campaign.trim()}
            onClick={() => {
              const id = uid("d");
              addDeal({
                id,
                brand,
                brandInitials: brand.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
                brandColor: "#222222",
                campaign,
                category: "tech",
                value,
                stage: "negotiating",
                platform,
                deliverables: [{ id: "x1", label: campaign, done: false }],
                dueDate: daysFromNow(21),
                paymentTerms: terms,
                contact: { name: `${brand} team`, email: `partners@${brand.toLowerCase().replace(/[^a-z]/g, "")}.example` },
                source: "direct",
                createdAt: toISODate(today()),
              });
              onClose();
              setBrand("");
              setCampaign("");
              onCreated(id);
            }}
          >
            Create deal
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Brand</span>
          <input className={input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Northwind Coffee" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Campaign</span>
          <input className={input} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. 60s YouTube integration" />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Value ($)</span>
            <input type="number" className={input} value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Platform</span>
            <select className={input} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORMS[p].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Terms</span>
            <select className={input} value={terms} onChange={(e) => setTerms(Number(e.target.value))}>
              {[7, 15, 30, 45, 60, 90].map((t) => (
                <option key={t} value={t}>
                  Net-{t}
                </option>
              ))}
            </select>
          </label>
        </div>
        {terms > 30 && <p className="rounded-lg bg-amber-soft p-3 text-sm text-amber">Net-{terms} means waiting {terms}+ days after invoicing. Consider asking for Net-15 or a 50% deposit.</p>}
      </div>
    </Modal>
  );
}
