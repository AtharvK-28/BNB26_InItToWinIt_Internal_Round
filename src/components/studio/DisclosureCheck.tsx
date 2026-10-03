"use client";

import { useMemo } from "react";
import { CircleAlert, CircleCheck, Scale, TriangleAlert, Wand2 } from "lucide-react";
import { checkDisclosure } from "@/lib/logic/disclosure";
import { cn } from "@/lib/utils";

/** Live FTC-style disclosure check for a sponsored caption. */
export function DisclosureCheck({ caption, onChange, brand, video = true }: { caption: string; onChange: (v: string) => void; brand?: string; video?: boolean }) {
  const result = useMemo(() => checkDisclosure(caption, { brand, video }), [caption, brand, video]);
  return (
    <div className="rounded-2xl border border-line-soft">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="size-4" /> Disclosure check
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", result.ok ? "bg-babu-soft text-babu" : "bg-arches-soft text-arches")}>{result.ok ? "Ready to post" : "Fix before posting"}</span>
      </div>
      <textarea value={caption} onChange={(e) => onChange(e.target.value)} rows={3} className="block w-full resize-none px-4 py-3 text-sm leading-relaxed outline-none" placeholder="Paste the caption for this sponsored post…" />
      <ul className="space-y-2 border-t border-line-soft px-4 py-3 text-sm">
        {result.issues.map((i) => (
          <li key={i.text} className="flex gap-2">
            {i.level === "pass" ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-babu" />
            ) : i.level === "fail" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-arches" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" />
            )}
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
      {!result.ok && (
        <div className="border-t border-line-soft px-4 py-3">
          <button onClick={() => onChange(result.fixed)} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
            <Wand2 className="size-3.5" /> Fix it for me
          </button>
        </div>
      )}
      <p className="border-t border-line-soft px-4 py-2.5 text-[11px] text-ink-2">Based on the FTC&apos;s influencer disclosure guidance. Not legal advice.</p>
    </div>
  );
}
