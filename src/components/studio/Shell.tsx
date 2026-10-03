"use client";

import type { ReactNode } from "react";
import { WhenHydrated } from "@/components/Providers";
import { cn } from "@/lib/utils";

export function StudioPage({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <main className={cn("mx-auto px-4 py-8 md:px-6 md:py-10 lg:px-10", wide ? "max-w-[1760px] xl:px-20" : "max-w-[1280px]", className)}>
      <WhenHydrated fallback={<PageSkeleton />}>{children}</WhenHydrated>
    </main>
  );
}

export function PageTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line-soft bg-white p-6", className)}>{children}</div>;
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-9 w-72 rounded-lg" />
      <div className="skeleton h-5 w-96 max-w-full rounded" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
