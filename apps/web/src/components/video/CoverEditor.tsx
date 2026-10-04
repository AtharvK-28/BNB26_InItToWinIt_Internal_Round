"use client";

import { useRef, useState } from "react";
import { mediaUrl, type Asset } from "@/lib/video/api";
import type { Cover } from "@/lib/video/runs";
import { cn } from "@/lib/utils";
import { useAssetLinks } from "./useProject";

/** Same palette the API uses when it renders cover.svg, so preview = export. */
const THEMES: Record<Cover["theme"], { bg: string; fg: string; label: string }> = {
  paper: { bg: "#f6f4ef", fg: "#282b27", label: "Paper" },
  coral: { bg: "#ad432f", fg: "#fffaf4", label: "Coral" },
  ink: { bg: "#282b27", fg: "#fffaf4", label: "Ink" },
};

/** Two draggable text layers over the cut's frame or a project image; stays editable in the exported SVG. */
export function CoverEditor({ cover, thumbnail, images = [], change }: { cover: Cover; thumbnail?: string; images?: Asset[]; change: (c: Cover) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const chosen = images.find((i) => i.id === cover.image_asset_id);
  const chosenLinks = useAssetLinks(chosen?.id);
  const picture = chosen ? (chosenLinks ? mediaUrl(chosenLinks.original) : undefined) : thumbnail;
  const [layer, setLayer] = useState<"title" | "subtitle">("title");
  const [dragging, setDragging] = useState(false);
  const theme = THEMES[cover.theme];
  const lines = (cover.title || "Your title").match(/.{1,21}(?:\s|$)|\S+/g)?.slice(0, 5) ?? [];

  function move(e: React.PointerEvent) {
    if (!dragging || !svg.current) return;
    const b = svg.current.getBoundingClientRect();
    change({
      ...cover,
      [`${layer}_x`]: Math.max(0, Math.min(0.8, (e.clientX - b.left) / b.width)),
      [`${layer}_y`]: Math.max(0.1, Math.min(layer === "title" ? 0.9 : 0.95, (e.clientY - b.top) / b.height)),
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-2xl shadow-card" onPointerMove={move} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
        <svg ref={svg} viewBox="0 0 720 1280" role="img" aria-label="Editable cover preview" className="block w-full touch-none select-none">
          <rect width="720" height="1280" fill={theme.bg} />
          {picture && <image href={picture} width="720" height="640" preserveAspectRatio="xMidYMid slice" />}
          <text
            x={cover.title_x * 720}
            y={cover.title_y * 1280}
            fill={theme.fg}
            fontSize={56}
            fontWeight={700}
            className="cursor-grab"
            onPointerDown={(e) => {
              setLayer("title");
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
          >
            {lines.map((line, i) => (
              <tspan key={i} x={cover.title_x * 720} dy={i ? 64 : 0}>
                {line.trim()}
              </tspan>
            ))}
          </text>
          <text
            x={cover.subtitle_x * 720}
            y={cover.subtitle_y * 1280}
            fill={theme.fg}
            fontSize={24}
            className="cursor-grab"
            onPointerDown={(e) => {
              setLayer("subtitle");
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
          >
            {cover.subtitle || "Your subtitle"}
          </text>
        </svg>
      </div>
      <div className="space-y-4 text-sm">
        <p className="text-ink-2">Drag either text layer on the cover, or use the controls. Both layers stay editable in the exported SVG.</p>
        <label className="block">
          <span className="mb-1 block font-semibold">Cover title</span>
          <input value={cover.title} maxLength={100} onChange={(e) => change({ ...cover, title: e.target.value })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Subtitle</span>
          <input value={cover.subtitle} maxLength={120} onChange={(e) => change({ ...cover, subtitle: e.target.value })} className="w-full rounded-lg border border-[#b0b0b0] px-3 py-2.5 outline-none focus:border-ink" />
        </label>
        <div>
          <span className="mb-1 block font-semibold">Move layer</span>
          <div className="inline-flex rounded-full bg-surface-2 p-1">
            {(["title", "subtitle"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLayer(l)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize", layer === l ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-2")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block font-semibold">Horizontal position</span>
          <input type="range" min={0} max={0.8} step={0.01} value={cover[`${layer}_x`]} onChange={(e) => change({ ...cover, [`${layer}_x`]: Number(e.target.value) })} className="w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Vertical position</span>
          <input type="range" min={0.1} max={layer === "title" ? 0.9 : 0.95} step={0.01} value={cover[`${layer}_y`]} onChange={(e) => change({ ...cover, [`${layer}_y`]: Number(e.target.value) })} className="w-full" />
        </label>
        {images.length > 0 && (
          <div>
            <span className="mb-1 block font-semibold">Background</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => change({ ...cover, image_asset_id: null })} aria-pressed={!cover.image_asset_id} className={cn("h-14 w-20 overflow-hidden rounded-lg border-2 text-[11px] font-semibold", !cover.image_asset_id ? "border-ink" : "border-line")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumbnail ? <img src={thumbnail} alt="Frame from the cut" className="size-full object-cover" /> : "Frame"}
              </button>
              {images.map((img) => (
                <ImageChoice key={img.id} image={img} active={cover.image_asset_id === img.id} choose={() => change({ ...cover, image_asset_id: img.id })} />
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-2">Images come from this project&apos;s Material.</p>
          </div>
        )}
        <div>
          <span className="mb-1 block font-semibold">Theme</span>
          <div className="flex gap-2">
            {(Object.keys(THEMES) as Cover["theme"][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => change({ ...cover, theme: t })}
                aria-pressed={cover.theme === t}
                className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold", cover.theme === t ? "border-ink" : "border-line")}
              >
                <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: THEMES[t].bg }} />
                {THEMES[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageChoice({ image, active, choose }: { image: Asset; active: boolean; choose: () => void }) {
  const links = useAssetLinks(image.id);
  return (
    <button type="button" onClick={choose} aria-pressed={active} title={image.filename} className={cn("h-14 w-20 overflow-hidden rounded-lg border-2 bg-surface-2", active ? "border-ink" : "border-line")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {links && <img src={mediaUrl(links.thumbnail)} alt={image.filename} className="size-full object-cover" />}
    </button>
  );
}
