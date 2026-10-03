"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { BadgeCheck } from "lucide-react";
import { avatar as avatarUrl, img, type ImageKey } from "@/lib/images";
import { cn } from "@/lib/utils";

/** Photo with a soft fade-in and a gradient fallback (so offline demos still look intentional). */
export function Photo({
  k,
  w = 720,
  h,
  alt = "",
  className,
  ...rest
}: { k: ImageKey; w?: number; h?: number; alt?: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Cached images can finish before hydration attaches onLoad.
    const el = ref.current;
    if (el?.complete) setState(el.naturalWidth ? "ok" : "err");
  }, []);
  return (
    <span className={cn("relative block overflow-hidden bg-surface-2", className)}>
      {state !== "err" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={img(k, w, h)}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          className={cn("size-full object-cover transition-opacity duration-500", state === "ok" ? "opacity-100" : "opacity-0")}
          {...rest}
        />
      )}
      {state === "loading" && <span className="skeleton absolute inset-0" />}
      {state === "err" && <span className="absolute inset-0 bg-gradient-to-br from-[#ffd1da] via-[#f7f7f7] to-[#ebebeb]" />}
    </span>
  );
}

export function Avatar({
  k,
  initials,
  color = "#222",
  size = 40,
  verified,
  className,
  ring,
}: {
  k?: ImageKey;
  initials?: string;
  color?: string;
  size?: number;
  verified?: boolean;
  className?: string;
  ring?: boolean;
}) {
  const [err, setErr] = useState(false);
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      {k && !err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl(k, Math.max(80, size * 2))}
          alt=""
          onError={() => setErr(true)}
          className={cn("size-full rounded-full bg-surface-2 object-cover", ring && "ring-2 ring-white")}
        />
      ) : (
        <span
          className={cn("flex size-full items-center justify-center rounded-full font-semibold text-white", ring && "ring-2 ring-white")}
          style={{ background: color, fontSize: size * (initials && initials.length > 2 ? 0.3 : 0.38) }}
        >
          {initials ?? "?"}
        </span>
      )}
      {verified && (
        <span className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full bg-white p-px">
          <BadgeCheck className="text-rausch" style={{ width: size * 0.36, height: size * 0.36 }} fill="#ff385c" stroke="#fff" />
        </span>
      )}
    </span>
  );
}

export function BrandLogo({ initials, color, size = 40, className }: { initials: string; color: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight text-white", className)}
      style={{ width: size, height: size, background: color, fontSize: size * (initials.length > 2 ? 0.28 : 0.36) }}
    >
      {initials}
    </span>
  );
}
