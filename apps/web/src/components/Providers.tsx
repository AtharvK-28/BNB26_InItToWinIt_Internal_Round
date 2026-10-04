"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useApp, useUi } from "@/lib/store";
import { SessionProvider } from "./video/Session";

export function Providers({ children }: { children: ReactNode }) {
  const setHydrated = useUi((s) => s.setHydrated);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).finally(setHydrated);
  }, [setHydrated]);
  return (
    <SessionProvider>
      {children}
      <Toasts />
    </SessionProvider>
  );
}

/** Airbnb-style toast: dark rounded card, bottom-left. */
function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed bottom-20 left-4 z-[200] flex flex-col gap-2 md:bottom-6 md:left-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-sm animate-slide-up items-center gap-3 rounded-xl bg-ink py-3 pr-3 pl-4 text-sm text-white shadow-float"
          role="status"
        >
          <span className="flex-1">{t.text}</span>
          {t.action && (
            <Link href={t.action.href} onClick={() => dismiss(t.id)} className="shrink-0 font-semibold underline underline-offset-2">
              {t.action.label}
            </Link>
          )}
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded-full p-1 hover:bg-white/10">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Renders children only after the persisted store has loaded (avoids hydration mismatches). */
export function WhenHydrated({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useUi((s) => s.hydrated);
  return <>{hydrated ? children : fallback}</>;
}
