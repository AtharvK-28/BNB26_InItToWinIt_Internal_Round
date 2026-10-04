"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { PlatformGlyph } from "@/components/ui/PlatformIcon";
import { PLATFORMS } from "@/lib/data/meta";
import { readStats, type ParsedStats } from "@/lib/logic/postStats";
import { useApp, useUi } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

const CHOICES: Platform[] = ["youtube", "tiktok", "instagram", "linkedin", "x"];

/** Import post stats from a platform's CSV export; nothing leaves the browser. */
export function StatsImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setPostStats = useApp((s) => s.setPostStats);
  const toast = useUi((s) => s.toast);
  const input = useRef<HTMLInputElement>(null);
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const parsed: ParsedStats | null = text ? readStats(text, platform) : null;

  async function choose(file: File | undefined) {
    setError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Choose a CSV under 5 MB.");
    setName(file.name);
    setText(await file.text());
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import your post stats"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-2">Stays in this browser. Re-import any time to refresh.</span>
          <Button
            variant="dark"
            disabled={!parsed?.posts.length}
            onClick={() => {
              setPostStats(parsed!.posts);
              toast(`Imported ${parsed!.posts.length} posts — Insights now uses your numbers.`);
              onClose();
            }}
          >
            Import {parsed?.posts.length ? `${parsed.posts.length} posts` : ""}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-6 text-sm">
        <p className="text-ink-2">
          Export a CSV from YouTube Studio (Analytics → Advanced mode → Export), Meta Business Suite, TikTok or LinkedIn. We read the title, publish time, views, likes, comments and shares columns.
        </p>
        <div>
          <div className="mb-2 font-semibold">Platform for rows without a platform column</div>
          <div className="flex flex-wrap gap-2">
            {CHOICES.map((p) => (
              <button key={p} type="button" onClick={() => setPlatform(p)} aria-pressed={platform === p} className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-semibold", platform === p ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
                <PlatformGlyph platform={p} size={14} /> {PLATFORMS[p].label}
              </button>
            ))}
          </div>
        </div>
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-label="Choose a CSV file" onChange={(e) => void choose(e.target.files?.[0])} />
        <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center hover:border-ink">
          <FileUp className="size-6 text-ink-2" />
          <span className="font-semibold">{name || "Choose a CSV file"}</span>
        </button>
        {error && <p className="rounded-xl bg-arches-soft p-3 text-arches">{error}</p>}
        {parsed && (
          <div className="rounded-xl bg-surface p-4">
            {parsed.posts.length ? (
              <>
                <div className="font-semibold">
                  {parsed.posts.length} posts ready · {compact(parsed.posts.reduce((s, p) => s + p.views, 0))} views
                </div>
                <div className="mt-1 text-xs text-ink-2">
                  Columns found: {parsed.found.join(", ")}
                  {parsed.skipped ? ` · ${parsed.skipped} rows skipped (no title or views)` : ""}
                </div>
                <ul className="mt-3 space-y-1">
                  {parsed.posts.slice(0, 3).map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span className="truncate">{p.title}</span>
                      <span className="shrink-0 tabular-nums">{compact(p.views)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-arches">No posts found. The file needs a title column and a views column.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
