/**
 * Client for the CreatorAi video pipeline API (services/api): projects, footage,
 * understanding, clip agent runs, editable cuts and exports. Ported from the
 * pipeline frontend; request/response contracts are unchanged.
 */
import { accessToken, cloudMode } from "./supabase";

export const apiBase =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
export type ProjectPlatform = "youtube" | "instagram" | "tiktok" | "linkedin" | "x";
export const PROJECT_PLATFORMS: ProjectPlatform[] = ["youtube", "instagram", "tiktok", "linkedin", "x"];
export type ProjectFields = {
  title: string;
  brief: string;
  platforms: ProjectPlatform[];
};
export type Project = ProjectFields & {
  id: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  if (cloudMode && !process.env.NEXT_PUBLIC_API_URL)
    throw new ApiError(0, "The hosted API URL is missing.");
  const token = await accessToken();
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "Your workspace is offline. Reconnect and try again; your text is still here.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.detail === "string"
        ? body.detail
        : response.status === 422
          ? "Check the field values and try again."
          : "We couldn’t reach your workspace. Try again in a moment.";
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

/** API timestamps are UTC, but SQLite (local mode) returns some without an offset. */
export const apiDate = (date: string) => new Date(/(Z|[+-]\d\d:?\d\d)$/.test(date) ? date : `${date}Z`);

export function updatedLabel(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(apiDate(date));
}

export type Asset = {
  id: string;
  project_id: string;
  filename: string;
  content_type: string;
  bytes: number;
  duration: number;
  width: number;
  height: number;
  codec: string;
  created_at: string;
  /** Video feeds the clip pipeline; the rest is organized alongside it. */
  kind: AssetKind;
};
export type AssetKind = "video" | "image" | "audio" | "document";
export const ASSET_ACCEPT = ".mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.flac,.pdf,.txt,.md,.srt";
export const assetKindLabel: Record<AssetKind, string> = { video: "Footage", image: "Image", audio: "Audio", document: "Document" };
export type MediaLinks = {
  original: string;
  thumbnail: string;
  expires_in: number;
};
export type Capabilities = {
  media_import: boolean;
  max_upload_mb: number;
  max_clip_seconds: number;
  max_audio_seconds?: number;
  ai_ready: boolean;
  worker_ready: boolean;
  ai_model: string;
};
export const mediaUrl = (path: string) =>
  path.startsWith("/") ? `${apiBase}${path}` : path;

export async function uploadAsset(
  projectId: string,
  file: File,
  signal: AbortSignal,
  onProgress: (value: number) => void,
): Promise<Asset> {
  const token = await accessToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    xhr.open(
      "POST",
      `${apiBase}/projects/${encodeURIComponent(projectId)}/assets`,
    );
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 120000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      cleanup();
      let body;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(
          new ApiError(
            xhr.status,
            "The upload could not be confirmed. Refresh material before retrying.",
          ),
        );
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as Asset);
      else
        reject(
          new ApiError(
            xhr.status,
            typeof body.detail === "string"
              ? body.detail
              : "This clip could not be imported. Try a playable MP4.",
          ),
        );
    };
    xhr.onerror = () => {
      cleanup();
      reject(
        new ApiError(
          0,
          "The connection dropped. Refresh material before retrying; your original is still on your device.",
        ),
      );
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(
        new ApiError(
          0,
          "Import is taking longer than expected. Refresh material before retrying.",
        ),
      );
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload stopped", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      cleanup();
      reject(new DOMException("Upload stopped", "AbortError"));
      return;
    }
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** Lightweight per-project status for cards and dashboards (3 small requests). */
export type ProjectSummary = {
  assets: Asset[];
  clips: number;
  exports: number;
  stage: "Add footage" | "Ready to cut" | "Cuts in review" | "Delivered";
};

export async function projectSummary(id: string, signal?: AbortSignal): Promise<ProjectSummary> {
  const [assets, clips, exports] = await Promise.all([
    api<Asset[]>(`/projects/${id}/assets`, { signal }),
    api<{ id: string }[]>(`/projects/${id}/clips`, { signal }),
    api<{ id: string }[]>(`/projects/${id}/exports`, { signal }),
  ]);
  const footage = assets.some((a) => a.kind === "video");
  const stage = exports.length ? "Delivered" : clips.length ? "Cuts in review" : footage ? "Ready to cut" : "Add footage";
  return { assets, clips: clips.length, exports: exports.length, stage };
}

export const durationLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
