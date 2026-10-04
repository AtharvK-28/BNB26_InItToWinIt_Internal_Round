import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** CreatorCover — escrow-backed payment protection (our AirCover equivalent). */
export function CreatorCoverMark({ className, small }: { className?: string; small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-extrabold tracking-tight", small ? "text-sm" : "text-xl", className)}>
      <ShieldCheck className={small ? "size-4 text-rausch" : "size-6 text-rausch"} strokeWidth={2.4} />
      <span>
        creator<span className="text-rausch">cover</span>
      </span>
    </span>
  );
}

export function CreatorCoverCard({ className }: { className?: string }) {
  const items = [
    ["Paid up front", "Brands pay in full when they book. No invoices to chase, no Net-60."],
    ["Held until you deliver", "Funds sit in escrow and release when the brand approves — or automatically 5 days after delivery if they go quiet."],
    ["Kill-fee guarantee", "If a brand cancels after you've started, you keep 50% — 100% once you've filmed."],
    ["0% creator fees", "Unlike storefronts that take 5–15%, every dollar of your price is yours."],
  ];
  return (
    <div className={cn("rounded-2xl border border-line-soft p-6", className)}>
      <CreatorCoverMark />
      <p className="mt-2 text-sm text-ink-2">Included with every package booking.</p>
      <ul className="mt-5 space-y-4">
        {items.map(([t, d]) => (
          <li key={t}>
            <div className="text-sm font-semibold">{t}</div>
            <div className="text-sm text-ink-2">{d}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EscrowPill({ status, amount }: { status: "funded" | "released"; amount: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", status === "funded" ? "bg-babu-soft text-babu" : "bg-surface-2 text-ink-2")}>
      <ShieldCheck className="size-3" />
      {status === "funded" ? `$${amount.toLocaleString("en-US")} held` : "Released"}
    </span>
  );
}
