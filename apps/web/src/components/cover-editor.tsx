"use client";

import { useRef, useState } from "react";
import { Cover } from "@/lib/demo";

export function CoverEditor({
  cover,
  thumbnail,
  change,
}: {
  cover: Cover;
  thumbnail?: string;
  change: (cover: Cover) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [layer, setLayer] = useState<"title" | "subtitle">("title");
  const [dragging, setDragging] = useState(false);
  const lines =
    (cover.title || "Your title").match(/.{1,21}(?:\s|$)|\S+/g)?.slice(0, 5) ??
    [];
  function move(event: React.PointerEvent) {
    if (!dragging || !svg.current) return;
    const bounds = svg.current.getBoundingClientRect();
    change({
      ...cover,
      [`${layer}_x`]: Math.max(
        0,
        Math.min(0.8, (event.clientX - bounds.left) / bounds.width),
      ),
      [`${layer}_y`]: Math.max(
        0.1,
        Math.min(
          layer === "title" ? 0.9 : 0.95,
          (event.clientY - bounds.top) / bounds.height,
        ),
      ),
    });
  }
  return (
    <div className="cover-editor">
      <div
        className={`cover-stage cover-${cover.theme}`}
        onPointerMove={move}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <svg
          ref={svg}
          viewBox="0 0 720 1280"
          role="img"
          aria-label="Editable cover preview"
        >
          <rect width="720" height="1280" className="cover-background" />
          {thumbnail && (
            <image
              href={thumbnail}
              width="720"
              height="640"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
          <text
            x={cover.title_x * 720}
            y={cover.title_y * 1280}
            className="cover-title"
            onPointerDown={(event) => {
              setLayer("title");
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          >
            {lines.map((line, index) => (
              <tspan key={index} x={cover.title_x * 720} dy={index ? 64 : 0}>
                {line.trim()}
              </tspan>
            ))}
          </text>
          <text
            x={cover.subtitle_x * 720}
            y={cover.subtitle_y * 1280}
            className="cover-subtitle"
            onPointerDown={(event) => {
              setLayer("subtitle");
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          >
            {cover.subtitle || "Your subtitle"}
          </text>
        </svg>
      </div>
      <div className="cover-controls">
        <p>
          Drag either text layer, or use the position controls. The package
          keeps both layers editable in SVG.
        </p>
        <label className="field-label" htmlFor="cover-title">
          Cover title
        </label>
        <input
          id="cover-title"
          value={cover.title}
          maxLength={100}
          onChange={(e) => change({ ...cover, title: e.target.value })}
        />
        <label className="field-label" htmlFor="cover-subtitle">
          Cover subtitle
        </label>
        <input
          id="cover-subtitle"
          value={cover.subtitle}
          maxLength={120}
          onChange={(e) => change({ ...cover, subtitle: e.target.value })}
        />
        <label className="field-label" htmlFor="cover-layer">
          Move layer
        </label>
        <select
          id="cover-layer"
          value={layer}
          onChange={(e) => setLayer(e.target.value as typeof layer)}
        >
          <option value="title">Title</option>
          <option value="subtitle">Subtitle</option>
        </select>
        <label className="field-label" htmlFor="cover-x">
          Horizontal position
        </label>
        <input
          id="cover-x"
          type="range"
          min={0}
          max={0.8}
          step={0.01}
          value={cover[`${layer}_x`]}
          onChange={(e) =>
            change({ ...cover, [`${layer}_x`]: Number(e.target.value) })
          }
        />
        <label className="field-label" htmlFor="cover-y">
          Vertical position
        </label>
        <input
          id="cover-y"
          type="range"
          min={0.1}
          max={layer === "title" ? 0.9 : 0.95}
          step={0.01}
          value={cover[`${layer}_y`]}
          onChange={(e) =>
            change({ ...cover, [`${layer}_y`]: Number(e.target.value) })
          }
        />
        <label className="field-label" htmlFor="cover-theme">
          Paper &amp; ink
        </label>
        <select
          id="cover-theme"
          value={cover.theme}
          onChange={(e) =>
            change({ ...cover, theme: e.target.value as Cover["theme"] })
          }
        >
          <option value="paper">Warm paper</option>
          <option value="coral">Terracotta</option>
          <option value="ink">Dark ink</option>
        </select>
      </div>
    </div>
  );
}
