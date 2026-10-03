"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

function useLockScroll(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

/** Airbnb-style modal: centered card with an X on the left and a centered title; a bottom sheet on phones. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 568,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
}) {
  useLockScroll(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-white shadow-float md:max-h-[88vh] md:rounded-2xl",
          className,
        )}
        style={{ maxWidth: width }}
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-line-soft px-6">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 flex size-8 items-center justify-center rounded-full hover:bg-surface-2">
            <X className="size-4" strokeWidth={2.5} />
          </button>
          <div className="text-base font-semibold">{title}</div>
        </div>
        <div className="thin-scrollbar flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line-soft px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Right-side panel (deal details, copilot). Full screen on phones. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  width = 560,
  headerExtra,
  backLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
  headerExtra?: ReactNode;
  backLabel?: string;
}) {
  useLockScroll(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end" role="dialog" aria-modal>
      <div className="absolute inset-0 animate-fade-in bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full animate-slide-in-right flex-col bg-white shadow-float" style={{ maxWidth: width }}>
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line-soft px-4">
          <button onClick={onClose} aria-label={backLabel ?? "Close"} className="flex size-8 items-center justify-center rounded-full hover:bg-surface-2">
            {backLabel ? <ChevronLeft className="size-5" /> : <X className="size-4" strokeWidth={2.5} />}
          </button>
          <div className="min-w-0 flex-1 truncate text-base font-semibold">{title}</div>
          {headerExtra}
        </div>
        <div className="thin-scrollbar flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Floating dropdown panel (search segments, menus). */
export function Popover({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={cn("absolute z-50 animate-pop rounded-3xl bg-white shadow-panel", className)}>{children}</div>
    </>
  );
}
