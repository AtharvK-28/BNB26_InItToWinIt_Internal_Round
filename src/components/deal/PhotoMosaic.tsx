"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Photo } from "@/components/ui/Media";
import { Modal } from "@/components/ui/Overlay";
import type { ImageKey } from "@/lib/images";
import { cn } from "@/lib/utils";

export function PhotoMosaic({ images, title }: { images: ImageKey[]; title: string }) {
  const [open, setOpen] = useState(false);
  const cells = [...images, ...images].slice(0, 5);
  return (
    <>
      <div className="relative">
        {/* Mobile: single hero */}
        <button onClick={() => setOpen(true)} className="block w-full md:hidden">
          <Photo k={images[0]} w={900} className="aspect-[4/3] w-full rounded-2xl" alt={title} />
        </button>
        <div className="hidden h-[min(56vh,460px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
          {cells.map((k, i) => (
            <button
              key={i}
              onClick={() => setOpen(true)}
              className={cn("group relative overflow-hidden", i === 0 && "col-span-2 row-span-2")}
              aria-label="Show all photos"
            >
              <Photo k={k} w={i === 0 ? 1100 : 560} className="size-full" alt={i === 0 ? title : ""} />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="absolute right-6 bottom-6 hidden items-center gap-2 rounded-lg border border-ink bg-white px-4 py-1.5 text-sm font-semibold hover:bg-surface md:flex"
        >
          <LayoutGrid className="size-4" /> Show all photos
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Campaign moodboard" width={980}>
        <div className="grid gap-2 p-4 md:grid-cols-2 md:p-6">
          {images.map((k, i) => (
            <Photo key={i} k={k} w={1000} className={cn("w-full rounded-lg", i % 3 === 0 ? "aspect-[16/10] md:col-span-2" : "aspect-square")} />
          ))}
        </div>
      </Modal>
    </>
  );
}
