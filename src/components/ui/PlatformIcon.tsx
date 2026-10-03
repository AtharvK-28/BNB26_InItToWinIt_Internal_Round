import { Mail, Mic, Radio } from "lucide-react";
import { PLATFORMS } from "@/lib/data/meta";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Simple generic glyphs for each platform (lucide v1 dropped brand icons). */
export function PlatformGlyph({
  platform,
  size = 16,
  className,
  inverse,
}: {
  platform: Platform | "email";
  size?: number;
  className?: string;
  /** Draw only the inner mark (for use on a colored badge). */
  inverse?: boolean;
}) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", className, "aria-hidden": true } as const;
  if (inverse && platform === "youtube")
    return (
      <svg {...p}>
        <path d="M8.5 6.5v11L18 12 8.5 6.5Z" fill="currentColor" />
      </svg>
    );
  if (inverse && platform === "linkedin")
    return (
      <svg {...p}>
        <path d="M5 9h3v10H5V9Zm1.5-4.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4ZM10 9h2.9v1.4c.5-.9 1.6-1.6 3.1-1.6 2.6 0 3.4 1.7 3.4 4V19h-3v-5.4c0-1.2-.3-2.1-1.5-2.1-1.3 0-1.9.9-1.9 2.3V19H10V9Z" fill="currentColor" />
      </svg>
    );
  switch (platform) {
    case "youtube":
      return (
        <svg {...p}>
          <rect x="2" y="5" width="20" height="14" rx="4.5" fill="currentColor" />
          <path d="M10 9.2v5.6l4.8-2.8L10 9.2Z" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...p}>
          <path
            d="M15.6 3h-3.1v12.1a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.3a5.9 5.9 0 1 0 5 5.8V9.2a7.4 7.4 0 0 0 4.3 1.4V7.5a4.3 4.3 0 0 1-4.3-4.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "x":
      return (
        <svg {...p}>
          <path d="M4 3.5h4.6l4 5.6 4.8-5.6h2.2l-6 7 6.9 9.9h-4.6l-4.3-6.1-5.3 6.1H4.1l6.5-7.4L4 3.5Z" fill="currentColor" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...p}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="currentColor" />
          <path d="M7 10h2.4v7H7v-7Zm1.2-3.6a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM11 10h2.3v1c.4-.7 1.2-1.2 2.4-1.2 2 0 2.6 1.3 2.6 3.1V17h-2.4v-3.6c0-.9-.2-1.6-1.1-1.6-1 0-1.4.7-1.4 1.7V17H11v-7Z" fill="#fff" />
        </svg>
      );
    case "twitch":
      return (
        <svg {...p}>
          <path d="M5 3 3.5 6.5V19H8v2.5h2.5L13 19h3.5l4-4V3H5Zm13.5 11-2.5 2.5h-4L9.5 19v-2.5H6V5h12.5v9Z" fill="currentColor" />
          <path d="M14.5 7.5h2v5h-2zm-5 0h2v5h-2z" fill="currentColor" />
        </svg>
      );
    case "newsletter":
    case "email":
      return <Mail width={size} height={size} className={className} strokeWidth={2} />;
    case "podcast":
      return <Mic width={size} height={size} className={className} strokeWidth={2} />;
    default:
      return <Radio width={size} height={size} className={className} />;
  }
}

/** Colored circular badge — used overlapping avatars and in lists. */
export function PlatformBadge({ platform, size = 22, className }: { platform: Platform | "email"; size?: number; className?: string }) {
  const color = platform === "email" ? "#6a6a6a" : PLATFORMS[platform].color;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-white ring-2 ring-white", className)}
      style={{ width: size, height: size, background: color }}
      title={platform === "email" ? "Email" : PLATFORMS[platform].label}
    >
      <PlatformGlyph platform={platform} size={Math.round(size * 0.58)} inverse />
    </span>
  );
}

export function PlatformChip({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-ink-2", className)}>
      <PlatformGlyph platform={platform} size={14} className="text-ink" />
      {PLATFORMS[platform].label}
    </span>
  );
}
