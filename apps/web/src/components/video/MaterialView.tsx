"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Controls";
import { api, ApiError, ASSET_ACCEPT, assetKindLabel, durationLabel, mediaUrl, uploadAsset, type Asset, type AssetKind, type MediaLinks, type Project } from "@/lib/video/api";
import { cn } from "@/lib/utils";
import { AssetIcon, assetMeta } from "./AssetIcon";
import { ApiNotice, PageLoading, ProjectHeader } from "./Chrome";
import { useCapabilities, useProject } from "./useProject";

const ACCEPTED = new Set(ASSET_ACCEPT.split(","));
const extension = (name: string) => name.slice(name.lastIndexOf(".")).toLowerCase();

export function MaterialView({ id }: { id: string }) {
  const { project, setProject, error, retry } = useProject(id);
  const caps = useCapabilities();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [listError, setListError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<AssetKind | "all">("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [links, setLinks] = useState<MediaLinks | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [queue, setQueue] = useState<{ name: string; index: number; total: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadController = useRef<AbortController | null>(null);
  const uploading = Boolean(queue);

  useEffect(() => {
    const controller = new AbortController();
    api<Asset[]>(`/projects/${encodeURIComponent(id)}/assets`, { signal: controller.signal })
      .then((items) => {
        setAssets(items);
        setListError("");
        setSelected((cur) => items.find((i) => i.id === cur?.id) ?? items.find((i) => i.kind === "video") ?? items[0] ?? null);
      })
      .catch((e: Error) => e.name !== "AbortError" && setListError(e.message));
    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    api<MediaLinks>(`/assets/${selected.id}/links`, { signal: controller.signal })
      .then((v) => {
        setLinks(v);
        setPreviewError("");
      })
      .catch((e: Error) => e.name !== "AbortError" && setPreviewError(e.message));
    return () => controller.abort();
  }, [selected, previewAttempt]);

  useEffect(() => () => uploadController.current?.abort(), []);

  function choose(a: Asset) {
    setLinks(null);
    setPreviewError("");
    setSelected(a);
    setPreviewAttempt((v) => v + 1);
  }

  /** Uploads one file at a time so progress stays readable and the API's import slots aren't flooded. */
  async function importFiles(files: File[]) {
    if (!caps || uploading || !files.length) return;
    setUploadErrors([]);
    setMessage("");
    const errors: string[] = [];
    const saved: Asset[] = [];
    for (const [index, file] of files.entries()) {
      if (!ACCEPTED.has(extension(file.name))) {
        errors.push(`${file.name}: this file type isn't supported yet.`);
        continue;
      }
      if (file.size === 0 || file.size > caps.max_upload_mb * 1024 * 1024) {
        errors.push(`${file.name}: choose a nonempty file under ${caps.max_upload_mb} MB.`);
        continue;
      }
      const controller = new AbortController();
      uploadController.current = controller;
      setQueue({ name: file.name, index, total: files.length });
      setProgress(0);
      try {
        const asset = await uploadAsset(id, file, controller.signal, setProgress);
        saved.push(asset);
        setAssets((items) => [asset, ...(items ?? []).filter((i) => i.id !== asset.id)]);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          errors.push(`${file.name}: upload stopped. Refresh to check whether it finished saving.`);
          break;
        }
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }
    setQueue(null);
    uploadController.current = null;
    setUploadErrors(errors);
    if (saved.length) {
      choose(saved.find((a) => a.kind === "video") ?? saved[saved.length - 1]);
      setMessage(saved.length === 1 ? `${saved[0].filename} saved. Originals stay untouched — every cut references them.` : `${saved.length} files saved. Originals stay untouched.`);
    }
  }

  if (error) return <ApiNotice error={error} retry={retry} />;
  if (!project) return <PageLoading label="Opening your material" />;

  const canImport = Boolean(caps?.media_import);
  const counts = (assets ?? []).reduce<Record<string, number>>((c, a) => ({ ...c, [a.kind]: (c[a.kind] ?? 0) + 1 }), {});
  const visible = (assets ?? []).filter((a) => filter === "all" || a.kind === filter);
  return (
    <>
      <ProjectHeader
        project={project}
        active="material"
        right={
          <Button variant="dark" onClick={() => fileInput.current?.click()} disabled={uploading || !canImport}>
            <Upload className="size-4" /> Add files
          </Button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ASSET_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose files to add"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          void importFiles(files);
        }}
      />
      {caps && !canImport && <p className="mb-6 rounded-2xl bg-amber-soft p-4 text-sm">Imports are waiting for FFmpeg on the pipeline server. You can keep working on your story.</p>}
      {listError && (
        <div className="mb-6">
          <ApiNotice error={listError} retry={() => setAttempt((v) => v + 1)} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <section aria-label="Project files">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void importFiles([...(e.dataTransfer.files ?? [])]);
            }}
            className={cn("rounded-2xl border-2 border-dashed p-6 text-center transition", dragOver ? "border-rausch bg-rausch-soft" : "border-line")}
          >
            {queue ? (
              <div role="status" aria-live="polite">
                <div className="truncate text-sm font-semibold">
                  {queue.total > 1 && `${queue.index + 1} of ${queue.total} · `}
                  {progress < 100 ? `Uploading ${queue.name} · ${progress}%` : `Reading ${queue.name} and making a preview…`}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={() => uploadController.current?.abort()} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2">
                  <X className="size-3.5" /> Stop upload
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-1.5 text-ink-2">
                  {(["video", "image", "audio", "document"] as AssetKind[]).map((k) => (
                    <AssetIcon key={k} kind={k} className="size-5" />
                  ))}
                </div>
                <div className="mt-2 font-semibold">Drop footage, images, audio or documents</div>
                <button onClick={() => fileInput.current?.click()} disabled={!canImport} className="text-sm font-semibold underline underline-offset-2 disabled:opacity-40">
                  or browse your files
                </button>
                {caps && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-2">
                    Video: MP4, WebM, MOV up to {Math.round(caps.max_clip_seconds / 60)} min · Images: JPG, PNG, WebP, GIF · Audio: MP3, WAV, M4A, AAC, OGG, FLAC{caps.max_audio_seconds ? ` up to ${Math.round(caps.max_audio_seconds / 60)} min` : ""} · Docs: PDF, TXT, MD, SRT · each under {caps.max_upload_mb} MB
                  </p>
                )}
              </>
            )}
          </div>
          {uploadErrors.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-arches-soft p-3 text-sm text-arches">
              {uploadErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {message && <p className="mt-3 rounded-xl bg-babu-soft p-3 text-sm text-babu">{message}</p>}

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Project files <span className="font-normal text-ink-2">{assets?.length ?? ""}</span>
            </h2>
            <button aria-label="Refresh files" disabled={uploading} onClick={() => setAttempt((v) => v + 1)} className="flex size-8 items-center justify-center rounded-full hover:bg-surface-2">
              <RefreshCw className="size-4" />
            </button>
          </div>
          {assets && assets.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                All
              </Chip>
              {(["video", "image", "audio", "document"] as AssetKind[])
                .filter((k) => counts[k])
                .map((k) => (
                  <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
                    {assetKindLabel[k]} · {counts[k]}
                  </Chip>
                ))}
            </div>
          )}
          {assets && assets.length === 0 && <p className="rounded-xl bg-surface p-4 text-sm text-ink-2">Nothing here yet. Add your raw footage first — then logos, cover photos, music beds or a brief, all kept with this project.</p>}
          <ul className="space-y-2">
            {visible.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => choose(a)}
                  aria-pressed={selected?.id === a.id}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", selected?.id === a.id ? "border-ink bg-surface" : "border-line-soft hover:border-ink")}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                    <AssetIcon kind={a.kind} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{a.filename}</span>
                    <span className="block text-xs text-ink-2">
                      {assetKindLabel[a.kind]} · {assetMeta(a)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="File preview">
          {selected ? (
            <>
              <div className={cn("overflow-hidden rounded-2xl", selected.kind === "video" ? "bg-black" : "bg-surface")}>
                {previewError ? (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-black p-6 text-center text-sm text-white">
                    <p>{previewError}</p>
                    <button
                      onClick={() => {
                        setLinks(null);
                        setPreviewAttempt((v) => v + 1);
                      }}
                      className="rounded-lg bg-white px-4 py-2 font-semibold text-ink"
                    >
                      Refresh preview
                    </button>
                  </div>
                ) : links ? (
                  <Preview asset={selected} links={links} onError={setPreviewError} />
                ) : (
                  <div className="skeleton aspect-video" />
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{selected.filename}</h2>
                  <p className="text-sm text-ink-2">
                    {assetKindLabel[selected.kind]} · {selected.kind === "video" ? `${selected.codec.toUpperCase()} · ${durationLabel(selected.duration)}` : assetMeta(selected)} · original kept untouched
                  </p>
                </div>
                <NextStep asset={selected} project={project} links={links} onProject={setProject} />
              </div>
            </>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-surface text-ink-2">
              <AssetIcon kind="video" className="size-10" />
              <p className="mt-2 text-sm">Your first frame goes here.</p>
            </div>
          )}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href={`/studio/projects/${id}`} className="flex items-center justify-between rounded-2xl border border-line-soft p-4 text-sm transition hover:shadow-soft">
              <span>
                <span className="block font-semibold">Write or paste the script</span>
                <span className="text-ink-2">The agent uses it to pick moments</span>
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/studio/library" className="flex items-center justify-between rounded-2xl border border-line-soft p-4 text-sm transition hover:shadow-soft">
              <span>
                <span className="block font-semibold">All your files</span>
                <span className="text-ink-2">Library across every project</span>
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Preview({ asset, links, onError }: { asset: Asset; links: MediaLinks; onError: (message: string) => void }) {
  const [text, setText] = useState<string | null>(null);
  const isText = asset.kind === "document" && asset.codec !== "pdf";
  useEffect(() => {
    if (!isText) return;
    const controller = new AbortController();
    fetch(mediaUrl(links.original), { signal: controller.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("expired"))))
      .then((t) => setText(t.slice(0, 8000)))
      .catch((e: Error) => e.name !== "AbortError" && onError("This preview link expired. Refresh it."));
    return () => controller.abort();
  }, [isText, links, onError]);

  if (asset.kind === "video")
    return (
      <video
        key={links.original}
        controls
        playsInline
        preload="metadata"
        poster={mediaUrl(links.thumbnail)}
        src={mediaUrl(links.original)}
        onError={() => onError("This clip couldn't play here. Refresh its preview, or try an H.264 MP4.")}
        className="aspect-video w-full bg-black object-contain"
      />
    );
  if (asset.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl(links.original)} alt={asset.filename} onError={() => onError("This image preview expired. Refresh it.")} className="max-h-[540px] w-full object-contain" />;
  if (asset.kind === "audio")
    return (
      <div className="p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(links.thumbnail)} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
        <audio key={links.original} controls preload="metadata" src={mediaUrl(links.original)} onError={() => onError("This audio preview expired. Refresh it.")} className="mt-4 w-full" />
      </div>
    );
  if (asset.codec === "pdf") return <iframe title={asset.filename} src={mediaUrl(links.original)} className="h-[540px] w-full bg-white" />;
  return (
    <div className="max-h-[540px] overflow-auto p-6">
      {text === null ? <div className="skeleton h-40 rounded-xl" /> : <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{text}</pre>}
    </div>
  );
}

/** What the selected file is for, as the one strong action. */
function NextStep({ asset, project, links, onProject }: { asset: Asset; project: Project; links: MediaLinks | null; onProject: (p: Project) => void }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | string>("idle");
  const cuts = `/studio/projects/${project.id}/cuts`;
  if (asset.kind === "video")
    return (
      <Button variant="rausch" href={cuts}>
        Find clips in this footage <ArrowRight className="size-4" />
      </Button>
    );
  if (asset.kind === "audio")
    return (
      <Button variant="outline" href={cuts}>
        Add as music under a cut <ArrowRight className="size-4" />
      </Button>
    );
  if (asset.kind === "image")
    return (
      <Button variant="outline" href={cuts}>
        Use as a cover background <ArrowRight className="size-4" />
      </Button>
    );
  if (asset.codec === "pdf") return null;

  async function applyAsScript() {
    if (!links) return;
    setState("busy");
    try {
      const text = await fetch(mediaUrl(links.original)).then((r) => (r.ok ? r.text() : Promise.reject(new Error("This file link expired. Refresh the preview."))));
      const saved = await api<Project>(`/projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: project.title, brief: text.slice(0, 20000), platforms: project.platforms, revision: project.revision }),
      });
      onProject(saved);
      setState("done");
    } catch (err) {
      setState(err instanceof ApiError && err.status === 409 ? "The script changed elsewhere. Reload, then try again." : (err as Error).message);
    }
  }
  return (
    <div className="text-right">
      {state === "done" ? (
        <Button variant="outline" href={`/studio/projects/${project.id}`}>
          Script updated — open Story <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button variant="outline" disabled={!links || state === "busy"} onClick={() => void applyAsScript()}>
          <FileText className="size-4" /> {state === "busy" ? "Saving…" : "Use as the project script"}
        </Button>
      )}
      {state !== "idle" && state !== "busy" && state !== "done" && <p className="mt-2 max-w-xs text-xs text-arches">{state}</p>}
    </div>
  );
}
