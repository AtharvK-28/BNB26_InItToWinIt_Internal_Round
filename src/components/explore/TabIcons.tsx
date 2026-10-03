"use client";

import { useId } from "react";

/* Small illustrated tab icons, in the spirit of Airbnb's 2025 header (original artwork). */

export function DealsIcon({ size = 44 }: { size?: number }) {
  const u = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id={`ti-d1-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a8f" />
          <stop offset="1" stopColor="#d70466" />
        </linearGradient>
        <linearGradient id={`ti-d2-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M17 13a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3h-3v-3a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v3h-3v-3Z" fill="#9b1046" />
      <rect x="7" y="15" width="34" height="25" rx="7" fill={`url(#ti-d1-${u})`} />
      <rect x="7" y="15" width="34" height="11" rx="7" fill={`url(#ti-d2-${u})`} />
      <rect x="21" y="23" width="6" height="6" rx="2" fill="#fff" />
      <path d="M38.5 5.5l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3Z" fill="#ffb400" />
    </svg>
  );
}

export function CollabsIcon({ size = 44 }: { size?: number }) {
  const u = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id={`ti-c1-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7cc4ff" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={`ti-c2-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4a5ff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="17" cy="17" r="7" fill={`url(#ti-c1-${u})`} />
      <path d="M5 38c0-7 5.4-12 12-12s12 5 12 12v1H5v-1Z" fill={`url(#ti-c1-${u})`} />
      <circle cx="31" cy="19" r="7" fill={`url(#ti-c2-${u})`} />
      <path d="M19 40c0-7 5.4-12 12-12s12 5 12 12v1H19v-1Z" fill={`url(#ti-c2-${u})`} />
      <circle cx="28.5" cy="16.5" r="2" fill="#fff" opacity=".45" />
    </svg>
  );
}

export function ServicesIcon({ size = 44 }: { size?: number }) {
  const u = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id={`ti-s1-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd56b" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={`ti-s2-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4b5563" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
      </defs>
      <rect x="6" y="18" width="36" height="22" rx="5" fill={`url(#ti-s2-${u})`} />
      <path d="M6 15.5 39.4 8.3a2 2 0 0 1 2.4 1.5l.9 4-36.7 7.9V15.5Z" fill={`url(#ti-s1-${u})`} />
      <path d="m12 14.2 4.5 5.4M20 12.5l4.5 5.4M28 10.8l4.5 5.4" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M21 25.5v8l7-4-7-4Z" fill="#ffd56b" />
    </svg>
  );
}

export function NewBadge() {
  return (
    <span className="absolute -top-1 -right-3 rounded-full bg-gradient-to-b from-[#3b5b8c] to-[#1d3557] px-1.5 py-px text-[9px] font-bold tracking-wide text-white shadow">
      NEW
    </span>
  );
}
