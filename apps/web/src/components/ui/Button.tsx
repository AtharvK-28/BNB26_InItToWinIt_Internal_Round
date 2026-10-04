"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "rausch" | "dark" | "outline" | "ghost" | "link" | "soft" | "ai";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  rausch: "btn-rausch font-semibold",
  dark: "bg-ink text-white font-semibold hover:bg-black",
  outline: "border border-ink text-ink font-semibold bg-white hover:bg-surface",
  ghost: "text-ink font-semibold hover:bg-surface",
  soft: "bg-surface-2 text-ink font-semibold hover:bg-line-soft",
  link: "text-ink font-semibold underline underline-offset-2 hover:text-black px-0! h-auto!",
  ai: "ai-bg text-white font-semibold hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-11 px-5 text-[15px] rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
}

/** Tracks the mouse so Rausch buttons get Airbnb's moving radial highlight. */
function trackMouse(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx-n", String(((e.clientX - r.left) / r.width) * 100));
  e.currentTarget.style.setProperty("--my-n", String(((e.clientY - r.top) / r.height) * 100));
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "dark", size = "md", loading, href, className, children, disabled, onMouseMove, ...rest },
  ref,
) {
  const cls = cn(
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition-[background,transform,filter] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls} onMouseMove={variant === "rausch" ? trackMouse : undefined}>
        {children}
      </Link>
    );
  return (
    <button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      onMouseMove={(e) => {
        if (variant === "rausch") trackMouse(e);
        onMouseMove?.(e);
      }}
      {...rest}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

export function IconButton({ className, children, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-surface-2 active:scale-95 disabled:opacity-30",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
