"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Chart kit — follows the data-viz spec: ≤24px bars with 4px rounded data-ends and
 * square baselines, 2px surface gaps in stacks, 2px lines, ≥8px end-markers with a
 * surface ring, hairline solid gridlines, text in ink tokens (never series color),
 * legends for ≥2 series, and a hover tooltip on every chart.
 */

const SURFACE = "#ffffff";
const GRID = "#ebebeb";
const AXIS_TEXT = "#6a6a6a";

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number, ticks = 4) {
  if (v <= 0) return { max: 1, step: 1 };
  const raw = v / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return { max: Math.ceil(v / step) * step, step };
}

/** Path for a column whose top corners are rounded (data-end) and bottom is square (baseline). */
function topRoundedRect(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/* ---------------- Tooltip ---------------- */

export interface TipRow {
  color?: string;
  label: string;
  value: string;
  strong?: boolean;
}

function Tooltip({ x, y, title, rows, containerW }: { x: number; y: number; title: string; rows: TipRow[]; containerW: number }) {
  const left = Math.min(Math.max(x, 90), containerW - 90);
  return (
    <div
      className="pointer-events-none absolute z-20 min-w-40 -translate-x-1/2 -translate-y-full rounded-xl bg-white px-3.5 py-2.5 text-xs shadow-panel ring-1 ring-black/5"
      style={{ left, top: y - 10 }}
    >
      <div className="mb-1.5 font-semibold text-ink-2">{title}</div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            {r.color && <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.color }} />}
            <span className={cn("tabular-nums", r.strong ? "font-bold text-ink" : "font-semibold text-ink")}>{r.value}</span>
            <span className="text-ink-2">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items, className }: { items: { color: string; label: string; value?: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-5 gap-y-2 text-xs", className)}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-ink-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          <span className="text-ink">{i.label}</span>
          {i.value && <span className="tabular-nums">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Stacked columns ---------------- */

export interface Series {
  id: string;
  label: string;
  color: string;
}

export function StackedColumns({
  data,
  series,
  height = 260,
  format,
  highlight,
  dimFrom,
}: {
  data: { label: string; sub?: string; values: Record<string, number> }[];
  series: Series[];
  height?: number;
  format: (n: number) => string;
  /** Index of the bar to emphasize (others drawn at full color, this one gets a label). */
  highlight?: number;
  /** Bars at or after this index render as "projected" (lighter wash). */
  dimFrom?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 44;
  const padB = 28;
  const plotH = height - padB - 8;
  const totals = data.map((d) => series.reduce((s, x) => s + (d.values[x.id] ?? 0), 0));
  const { max, step } = niceMax(Math.max(...totals) * 1.08);
  const slot = w > 0 ? (w - padL) / data.length : 0;
  const bw = Math.min(24, slot * 0.55);
  const y = (v: number) => 8 + plotH - (v / max) * plotH;
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(t);

  return (
    <div ref={ref} className="relative select-none" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Stacked column chart">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                {format(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            let acc = 0;
            const segs = series
              .map((s) => ({ s, v: d.values[s.id] ?? 0 }))
              .filter((x) => x.v > 0);
            const dim = dimFrom !== undefined && i >= dimFrom;
            return (
              <g key={d.label} opacity={hover !== null && hover !== i ? 0.55 : dim ? 0.45 : 1} style={{ transition: "opacity .15s" }}>
                {segs.map(({ s, v }, k) => {
                  const y0 = y(acc);
                  acc += v;
                  const y1 = y(acc);
                  const isTop = k === segs.length - 1;
                  // 2px surface gap between stacked segments
                  const gapTop = isTop ? 0 : 1;
                  const gapBottom = k === 0 ? 0 : 1;
                  const top = y1 + gapTop;
                  const h = Math.max(0, y0 - gapBottom - top);
                  return isTop ? (
                    <path key={s.id} d={topRoundedRect(cx - bw / 2, top, bw, h)} fill={s.color} />
                  ) : (
                    <rect key={s.id} x={cx - bw / 2} y={top} width={bw} height={h} fill={s.color} />
                  );
                })}
                <text x={cx} y={height - 10} textAnchor="middle" fontSize={11} fill={i === highlight ? "#222" : AXIS_TEXT} fontWeight={i === highlight ? 600 : 400}>
                  {d.label}
                </text>
                {i === highlight && (
                  <text x={cx} y={y(totals[i]) - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill="#222">
                    {format(totals[i])}
                  </text>
                )}
                {/* Hit target: the whole slot */}
                <rect
                  x={cx - slot / 2}
                  y={0}
                  width={slot}
                  height={height - padB}
                  fill="transparent"
                  tabIndex={0}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  style={{ outline: "none" }}
                />
              </g>
            );
          })}
          <line x1={padL} x2={w} y1={y(0)} y2={y(0)} stroke="#dddddd" strokeWidth={1} />
        </svg>
      )}
      {hover !== null && w > 0 && (
        <Tooltip
          x={padL + slot * hover + slot / 2}
          y={y(totals[hover])}
          containerW={w}
          title={`${data[hover].sub ?? data[hover].label}${dimFrom !== undefined && hover >= dimFrom ? " · projected" : ""}`}
          rows={[
            ...[...series].reverse().map((s) => ({ color: s.color, label: s.label, value: format(data[hover].values[s.id] ?? 0) })),
            { label: "Total", value: format(totals[hover]), strong: true },
          ]}
        />
      )}
    </div>
  );
}

/* ---------------- Single-series columns with a reference line ---------------- */

export function Columns({
  data,
  height = 180,
  color = "#222222",
  reference,
  format,
  overColor = "#ec835a",
}: {
  data: { label: string; sub?: string; value: number }[];
  height?: number;
  color?: string;
  reference?: { value: number; label: string };
  format: (n: number) => string;
  overColor?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 8;
  const padB = 24;
  const plotH = height - padB - 18;
  const { max } = niceMax(Math.max(...data.map((d) => d.value), reference?.value ?? 0) * 1.15);
  const slot = w > 0 ? (w - padL) / data.length : 0;
  const bw = Math.min(24, slot * 0.5);
  const y = (v: number) => 18 + plotH - (v / max) * plotH;
  return (
    <div ref={ref} className="relative select-none" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Column chart">
          <line x1={padL} x2={w} y1={y(0)} y2={y(0)} stroke="#dddddd" />
          {reference && (
            <g>
              <line x1={padL} x2={w} y1={y(reference.value)} y2={y(reference.value)} stroke="#b0b0b0" strokeWidth={1} />
              <text x={padL} y={y(reference.value) - 5} textAnchor="start" fontSize={10.5} fill={AXIS_TEXT}>
                {reference.label}
              </text>
            </g>
          )}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            const over = reference && d.value > reference.value;
            const h = Math.max(d.value > 0 ? 3 : 0, y(0) - y(d.value));
            return (
              <g key={d.label + i} opacity={hover !== null && hover !== i ? 0.55 : 1}>
                <path d={topRoundedRect(cx - bw / 2, y(0) - h, bw, h)} fill={over ? overColor : color} />
                {over && (
                  <text x={cx} y={y(d.value) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#222">
                    !
                  </text>
                )}
                <text x={cx} y={height - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                  {d.label}
                </text>
                <rect
                  x={cx - slot / 2}
                  y={0}
                  width={slot}
                  height={height - padB}
                  fill="transparent"
                  tabIndex={0}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  style={{ outline: "none" }}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <Tooltip
          x={padL + slot * hover + slot / 2}
          y={y(data[hover].value)}
          containerW={w}
          title={data[hover].sub ?? data[hover].label}
          rows={[
            { label: "planned", value: format(data[hover].value), strong: true },
            ...(reference ? [{ label: "capacity", value: format(reference.value) }] : []),
          ]}
        />
      )}
    </div>
  );
}

/* ---------------- Sparkline ---------------- */

export function Sparkline({
  values,
  labels,
  height = 40,
  format = (n: number) => n.toLocaleString(),
  accent = "#ff385c",
}: {
  values: number[];
  labels?: string[];
  height?: number;
  format?: (n: number) => string;
  accent?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 6;
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  const hi = hover ?? last;
  return (
    <div
      ref={ref}
      className="relative"
      style={{ height }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - pad) / (w - pad * 2)) * (values.length - 1));
        setHover(Math.max(0, Math.min(last, i)));
      }}
      onPointerLeave={() => setHover(null)}
    >
      {w > 0 && (
        <svg width={w} height={height} aria-hidden>
          <path d={d} fill="none" stroke="#b0b0b0" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={height} stroke="#dddddd" />}
          <circle cx={x(hi)} cy={y(values[hi])} r={4} fill={accent} stroke={SURFACE} strokeWidth={2} />
        </svg>
      )}
      {hover !== null && w > 0 && (
        <div className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white" style={{ left: x(hover) }}>
          {format(values[hover])}
          {labels?.[hover] && <span className="font-normal text-white/70"> · {labels[hover]}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------------- Heatmap (sequential, one hue) ---------------- */

const ROSE_RAMP = ["#fff0f3", "#ffd6de", "#ffb3c1", "#ff8aa1", "#ff5c7a", "#e31c5f", "#a3134b"];

export function Heatmap({
  rows,
  cols,
  values,
  format = (v: number) => `${Math.round(v * 100)}`,
}: {
  rows: string[];
  cols: string[];
  values: number[][];
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const color = (v: number) => ROSE_RAMP[Math.min(ROSE_RAMP.length - 1, Math.floor(v * ROSE_RAMP.length))];
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${cols.length}, minmax(0, 1fr))` }}>
        <span />
        {cols.map((c) => (
          <span key={c} className="pb-1 text-center text-[11px] text-ink-2">
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <RowCells key={r} label={r}>
            {values[ri].map((v, ci) => (
              <button
                key={ci}
                aria-label={`${r} ${cols[ci]}: engagement index ${format(v)}`}
                onPointerEnter={() => setHover({ r: ri, c: ci })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ r: ri, c: ci })}
                onBlur={() => setHover(null)}
                className={cn("relative h-8 rounded-md transition", hover?.r === ri && hover?.c === ci && "ring-2 ring-ink ring-offset-1")}
                style={{ background: color(v) }}
              >
                {hover?.r === ri && hover?.c === ci && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-white px-2.5 py-1.5 text-left text-xs whitespace-nowrap shadow-panel ring-1 ring-black/5">
                    <b className="text-ink">{format(v)}</b> <span className="text-ink-2">engagement · {r} {cols[ci]}</span>
                  </span>
                )}
              </button>
            ))}
          </RowCells>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-ink-2">
        Lower
        <span className="flex overflow-hidden rounded">
          {ROSE_RAMP.map((c) => (
            <span key={c} className="h-2.5 w-5" style={{ background: c }} />
          ))}
        </span>
        Higher engagement
      </div>
    </div>
  );
}

function RowCells({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="flex items-center text-xs text-ink-2">{label}</span>
      {children}
    </>
  );
}

/* ---------------- Line with forecast band ---------------- */

export function ForecastLine({
  history,
  forecast,
  height = 220,
  format,
  color = "#222222",
}: {
  history: { label: string; value: number }[];
  forecast: { label: string; value: number; low: number; high: number }[];
  height?: number;
  format: (n: number) => string;
  color?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const all = [...history.map((h) => ({ ...h, low: h.value, high: h.value, f: false })), ...forecast.map((f) => ({ ...f, f: true }))];
  const padL = 44;
  const padB = 26;
  const plotH = height - padB - 10;
  const { max, step } = niceMax(Math.max(...all.map((a) => a.high)) * 1.05);
  const x = (i: number) => padL + 10 + (i / (all.length - 1)) * (w - padL - 20);
  const y = (v: number) => 10 + plotH - (v / max) * plotH;
  const hLast = history.length - 1;
  const histPath = history.map((h, i) => `${i ? "L" : "M"}${x(i)},${y(h.value)}`).join(" ");
  const fcPts = [{ i: hLast, v: history[hLast].value }, ...forecast.map((f, k) => ({ i: hLast + 1 + k, v: f.value }))];
  const fcPath = fcPts.map((p, k) => `${k ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ");
  const band =
    `M${x(hLast)},${y(history[hLast].value)} ` +
    forecast.map((f, k) => `L${x(hLast + 1 + k)},${y(f.high)}`).join(" ") +
    " " +
    [...forecast].reverse().map((f, k) => `L${x(hLast + forecast.length - k)},${y(f.low)}`).join(" ") +
    " Z";
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(t);

  return (
    <div
      ref={ref}
      className="relative select-none"
      style={{ height }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - padL - 10) / (w - padL - 20)) * (all.length - 1));
        setHover(Math.max(0, Math.min(all.length - 1, i)));
      }}
      onPointerLeave={() => setHover(null)}
    >
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Income history and forecast">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {format(t)}
              </text>
            </g>
          ))}
          <path d={band} fill={color} opacity={0.08} />
          <path d={histPath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={fcPath} fill="none" stroke={color} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" opacity={0.7} />
          {all.map((a, i) =>
            i % 2 === 0 || i === all.length - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                {a.label}
              </text>
            ) : null,
          )}
          <circle cx={x(hLast)} cy={y(history[hLast].value)} r={4.5} fill={color} stroke={SURFACE} strokeWidth={2} />
          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={8} y2={y(0)} stroke="#b0b0b0" />
              <circle cx={x(hover)} cy={y(all[hover].value)} r={4.5} fill={color} stroke={SURFACE} strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <Tooltip
          x={x(hover)}
          y={y(all[hover].high)}
          containerW={w}
          title={`${all[hover].label}${all[hover].f ? " · forecast" : ""}`}
          rows={
            all[hover].f
              ? [
                  { label: "expected", value: format(all[hover].value), strong: true, color },
                  { label: "likely range", value: `${format(all[hover].low)}–${format(all[hover].high)}` },
                ]
              : [{ label: "earned", value: format(all[hover].value), strong: true, color }]
          }
        />
      )}
    </div>
  );
}

/* ---------------- Meter ---------------- */

export function Meter({ ratio, className }: { ratio: number; className?: string }) {
  const pctv = Math.min(1, ratio);
  const tone = ratio < 0.9 ? { fill: "#008a05", track: "#e8f5e9" } : ratio < 1.1 ? { fill: "#e07a00", track: "#fff1dc" } : { fill: "#c13515", track: "#ffe6df" };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full", className)} style={{ background: tone.track }}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pctv * 100}%`, background: tone.fill }} />
    </div>
  );
}

/** Fades content in once mounted; avoids SSR width-0 flashes for charts. */
export function ChartFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("animate-fade-in", className)}>{children}</div>;
}
