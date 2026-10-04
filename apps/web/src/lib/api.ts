import { accessToken, cloudMode } from "./supabase";

export const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
export type Platform = "youtube" | "instagram";
export type ProjectFields = {
  title: string;
  brief: string;
  platforms: Platform[];
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

export function updatedLabel(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
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
};
export type MediaLinks = {
  original: string;
  thumbnail: string;
  expires_in: number;
};
export type Capabilities = {
  media_import: boolean;
  max_upload_mb: number;
  max_clip_seconds: number;
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
