/** Original laurel-branch artwork for "Creator favorite" badges. */
export function Laurel({ side = "left", size = 40, className }: { side?: "left" | "right"; size?: number; className?: string }) {
  const leaves = [
    { cx: 14, cy: 33, r: -40 },
    { cx: 10, cy: 26, r: -20 },
    { cx: 9, cy: 18.5, r: 0 },
    { cx: 11, cy: 11, r: 25 },
    { cx: 15, cy: 5, r: 50 },
  ];
  return (
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 24 40"
      className={className}
      style={side === "right" ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path d="M20 39C10 33 6 22 13 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.cx} cy={l.cy} rx="2.6" ry="5.2" fill="currentColor" transform={`rotate(${l.r} ${l.cx} ${l.cy})`} />
      ))}
      {leaves.slice(0, 4).map((l, i) => (
        <ellipse key={`r${i}`} cx={l.cx + 7} cy={l.cy - 3} rx="2.2" ry="4.4" fill="currentColor" transform={`rotate(${l.r + 60} ${l.cx + 7} ${l.cy - 3})`} />
      ))}
    </svg>
  );
}
