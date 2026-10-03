"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Overlay";

export function DealDescription({ text, brand }: { text: string; brand: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-b border-line-soft py-8">
      <p className="line-clamp-5 text-[15px] leading-6">{text}</p>
      <button onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
        Show more <ChevronRight className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="About this campaign">
        <div className="space-y-4 p-6 text-[15px] leading-6">
          <h3 className="text-2xl font-semibold">The brief from {brand}</h3>
          <p>{text}</p>
          <h4 className="pt-2 font-semibold">What great submissions have in common</h4>
          <ul className="list-disc space-y-1 pl-5 text-ink-2">
            <li>A specific angle — not a generic product walkthrough</li>
            <li>Real usage over at least a week before filming</li>
            <li>Honest drawbacks, which make the recommendation more credible</li>
          </ul>
        </div>
      </Modal>
    </section>
  );
}
