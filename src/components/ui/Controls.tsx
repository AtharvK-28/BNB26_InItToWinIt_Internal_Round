"use client";

import { Check, Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Airbnb switch: grey track, black when on, white knob with a check. */
export function Toggle({ on, onChange, label, size = "md" }: { on: boolean; onChange: (v: boolean) => void; label?: string; size?: "sm" | "md" }) {
  const w = size === "sm" ? 40 : 48;
  const h = size === "sm" ? 24 : 32;
  const knob = h - 4;
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative shrink-0 rounded-full transition-colors duration-200", on ? "bg-ink" : "bg-[#b0b0b0] hover:bg-ink-3")}
      style={{ width: w, height: h }}
    >
      <span
        className="absolute top-0.5 flex items-center justify-center rounded-full bg-white shadow transition-[left] duration-200"
        style={{ width: knob, height: knob, left: on ? w - knob - 2 : 2 }}
      >
        {on && <Check className="size-3 text-ink" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

/** Rounded segmented control (Airbnb host "Today | Upcoming"). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-surface-2 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full font-semibold transition-all",
            size === "sm" ? "px-3.5 py-1.5 text-[13px]" : "px-5 py-2 text-sm",
            value === o.id ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Pill filter chip (Airbnb "Filters" style). */
export function Chip({
  active,
  onClick,
  children,
  className,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition",
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
        className,
      )}
    >
      {children}
      {count !== undefined && <span className={cn("text-xs", active ? "text-white/70" : "text-ink-2")}>{count}</span>}
    </button>
  );
}

export function Stars({ value, size = 12, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-px", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-ink text-ink" : "fill-line text-line"} />
      ))}
    </span>
  );
}

export function Pill({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: "neutral" | "good" | "warn" | "bad" | "info" | "rausch" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink",
    good: "bg-babu-soft text-babu",
    warn: "bg-amber-soft text-amber",
    bad: "bg-arches-soft text-arches",
    info: "bg-sky-soft text-sky",
    rausch: "bg-rausch-soft text-rausch-dark",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line-soft", className)} />;
}
