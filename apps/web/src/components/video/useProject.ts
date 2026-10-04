"use client";

import { useEffect, useState } from "react";
import { api, type Capabilities, type MediaLinks, type Project } from "@/lib/video/api";

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<Project>(`/projects/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((p) => {
        setProject(p);
        setError("");
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [id, attempt]);
  return { project, setProject, error, retry: () => setAttempt((n) => n + 1) };
}

export function useCapabilities() {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<Capabilities>("/capabilities", { signal: controller.signal })
      .then(setCaps)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return caps;
}

/** Short-lived signed links for one asset (thumbnail + original); refreshes when the id changes. */
export function useAssetLinks(assetId: string | null | undefined) {
  const [links, setLinks] = useState<{ id: string; value: MediaLinks } | null>(null);
  useEffect(() => {
    if (!assetId) return;
    const controller = new AbortController();
    api<MediaLinks>(`/assets/${assetId}/links`, { signal: controller.signal })
      .then((value) => setLinks({ id: assetId, value }))
      .catch(() => {});
    return () => controller.abort();
  }, [assetId]);
  return assetId && links?.id === assetId ? links.value : null;
}
