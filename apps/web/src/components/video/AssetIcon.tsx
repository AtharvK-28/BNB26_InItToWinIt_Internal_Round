import { FileText, Film, Image as ImageIcon, Music } from "lucide-react";
import type { AssetKind } from "@/lib/video/api";

export const ASSET_ICONS: Record<AssetKind, typeof Film> = { video: Film, image: ImageIcon, audio: Music, document: FileText };

export function AssetIcon({ kind, className }: { kind: AssetKind; className?: string }) {
  const Icon = ASSET_ICONS[kind] ?? FileText;
  return <Icon className={className} />;
}

/** One line of facts per asset kind, e.g. "0:30 · 1280×720 · 10.2 MB". */
export function assetMeta(a: { kind: AssetKind; duration: number; width: number; height: number; bytes: number; codec: string }) {
  const mb = a.bytes < 1024 * 1024 ? `${Math.max(1, Math.round(a.bytes / 1024))} KB` : `${(a.bytes / 1024 / 1024).toFixed(1)} MB`;
  const time = `${Math.floor(a.duration / 60)}:${String(Math.floor(a.duration % 60)).padStart(2, "0")}`;
  if (a.kind === "video") return `${time} · ${a.width}×${a.height} · ${mb}`;
  if (a.kind === "image") return `${a.width}×${a.height} · ${mb}`;
  if (a.kind === "audio") return `${time} · ${mb}`;
  return `${a.codec === "pdf" ? "PDF" : "Text"} · ${mb}`;
}
