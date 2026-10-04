"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Film, Plus, RefreshCw } from "lucide-react";
import {
  api,
  Asset,
  Capabilities,
  MediaLinks,
  mediaUrl,
  Project,
  uploadAsset,
} from "@/lib/api";
import { ProjectStages } from "./project-stages";

const durationLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function MaterialWorkspace({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [links, setLinks] = useState<MediaLinks | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadController = useRef<AbortController | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Project>(`/projects/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      }),
      api<Asset[]>(`/projects/${encodeURIComponent(id)}/assets`, {
        signal: controller.signal,
      }),
      api<Capabilities>("/capabilities", { signal: controller.signal }),
    ])
      .then(([project, items, capabilities]) => {
        if (controller.signal.aborted) return;
        setProject(project);
        setAssets(items);
        setCapabilities(capabilities);
        setError("");
        setSelected(
          (current) =>
            items.find((item) => item.id === current?.id) ?? items[0] ?? null,
        );
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    api<MediaLinks>(`/assets/${selected.id}/links`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (controller.signal.aborted) return;
        setLinks(value);
        setPreviewError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setPreviewError(error.message);
      });
    return () => controller.abort();
  }, [selected, previewAttempt]);
  useEffect(() => () => uploadController.current?.abort(), []);
  function choose(asset: Asset) {
    setLinks(null);
    setPreviewError("");
    setSelected(asset);
    setPreviewAttempt((value) => value + 1);
  }
  async function importFile(file: File) {
    if (!capabilities || uploading) return;
    setUploadError("");
    setMessage("");
    if (
      file.size === 0 ||
      file.size > capabilities.max_upload_mb * 1024 * 1024
    ) {
      setUploadError(
        `Choose a nonempty clip under ${capabilities.max_upload_mb} MB.`,
      );
      return;
    }
    if (!/\.(mp4|webm|mov)$/i.test(file.name)) {
      setUploadError("Choose an MP4, WebM, or H.264 MOV clip.");
      return;
    }
    const controller = new AbortController();
    uploadController.current = controller;
    setUploading(true);
    setProgress(0);
    try {
      const asset = await uploadAsset(id, file, controller.signal, setProgress);
      setAssets((items) => [
        asset,
        ...items.filter((item) => item.id !== asset.id),
      ]);
      choose(asset);
      setMessage("Material saved. Your original stays intact.");
    } catch (error) {
      if ((error as Error).name === "AbortError")
        setUploadError(
          "Upload stopped. Refresh material to check whether it finished saving.",
        );
      else setUploadError((error as Error).message);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setUploading(false);
      uploadController.current = null;
    }
  }
  if (error)
    return (
      <div className="page">
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
          <Link className="text-link" href="/">
            All projects
          </Link>
        </div>
      </div>
    );
  if (!project || !capabilities)
    return (
      <div className="page loading" role="status">
        Opening your material…
      </div>
    );
  return (
    <div className="page material-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} aria-hidden="true" />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT / MATERIAL</p>
          <h1>{project.title}</h1>
          <p className="lede">Bring the moments you want to build on.</p>
        </div>
        <button
          className="button primary"
          onClick={() => fileInput.current?.click()}
          disabled={uploading || !capabilities.media_import}
        >
          <Plus size={17} aria-hidden="true" />
          Add a clip
        </button>
      </div>
      <input
        className="visually-hidden"
        ref={fileInput}
        type="file"
        accept=".mp4,.webm,.mov"
        tabIndex={-1}
        aria-label="Choose a video clip"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importFile(file);
        }}
      />
      <ProjectStages id={id} active="material" />
      {!capabilities.media_import && (
        <p className="notice" role="status">
          Clip import is waiting for media tools on this workspace. You can keep
          working on your story.
        </p>
      )}
      {uploading && (
        <div className="upload-status" role="status" aria-live="polite">
          <div>
            <strong>
              {progress < 100
                ? `Uploading · ${progress}%`
                : "Reading your clip and making a preview…"}
            </strong>
            <p>Your original will stay intact.</p>
          </div>
          <progress value={progress} max={100} aria-label="Upload progress" />
          <button
            className="text-link"
            onClick={() => uploadController.current?.abort()}
          >
            Stop upload
          </button>
        </div>
      )}
      {uploadError && (
        <div className="notice error" role="alert" tabIndex={-1} ref={errorRef}>
          <p>{uploadError}</p>
          <button
            className="text-link"
            onClick={() => {
              setAttempt((value) => value + 1);
              setUploadError("");
            }}
          >
            Refresh material
          </button>
        </div>
      )}
      {message && (
        <p className="recovery-note" role="status">
          {message}
        </p>
      )}
      <div className="material-layout">
        <section className="material-library" aria-label="Project clips">
          <div className="section-heading">
            <h2>
              Source clips <span className="count">{assets.length}</span>
            </h2>
            <button
              className="icon-button"
              aria-label="Refresh material"
              disabled={uploading}
              onClick={() => setAttempt((value) => value + 1)}
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
          {assets.length === 0 ? (
            <div className="material-empty">
              <Film size={28} strokeWidth={1.3} aria-hidden="true" />
              <h2>Every story starts somewhere.</h2>
              <p>
                Add one short source clip. It will be ready to watch here and
                use in your next edit.
              </p>
            </div>
          ) : (
            <ul className="clip-list">
              {assets.map((asset, index) => (
                <li key={asset.id}>
                  <button
                    className="clip-row"
                    aria-pressed={selected?.id === asset.id}
                    onClick={() => choose(asset)}
                  >
                    <span className="clip-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="clip-copy">
                      <strong>{asset.filename}</strong>
                      <span>
                        {durationLabel(asset.duration)} · {asset.width} ×{" "}
                        {asset.height} ·{" "}
                        {(asset.bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </span>
                    <Film size={17} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="material-limit">
            MP4, WebM or H.264 MOV · up to {capabilities.max_upload_mb} MB and{" "}
            {capabilities.max_clip_seconds / 60} minutes per clip.
          </p>
        </section>
        <section className="material-preview" aria-label="Clip preview">
          {selected ? (
            <>
              <div className="preview-label">
                <p className="eyebrow">ORIGINAL / PREVIEW</p>
                <span>{selected.codec.toUpperCase()}</span>
              </div>
              <div className="video-surface">
                {previewError ? (
                  <div className="preview-state" role="alert">
                    <p>{previewError}</p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setLinks(null);
                        setPreviewAttempt((value) => value + 1);
                      }}
                    >
                      Refresh preview
                    </button>
                  </div>
                ) : links ? (
                  <video
                    key={links.original}
                    controls
                    playsInline
                    preload="metadata"
                    poster={mediaUrl(links.thumbnail)}
                    src={mediaUrl(links.original)}
                    onError={() =>
                      setPreviewError(
                        "This clip couldn’t play here. Refresh its preview, or try an H.264 MP4.",
                      )
                    }
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <p className="preview-state" role="status">
                    Opening the original…
                  </p>
                )}
              </div>
              <h2 className="preview-title">{selected.filename}</h2>
              <p className="preview-description">
                Your source stays untouched. Editable cuts reference this file.
              </p>
            </>
          ) : (
            <div className="preview-placeholder">
              <span className="frame-corner top-left" />
              <span className="frame-corner bottom-right" />
              <Film size={38} strokeWidth={1} aria-hidden="true" />
              <p>Your first frame goes here.</p>
            </div>
          )}
          <Link className="text-link story-next" href={`/projects/${id}`}>
            Open the story
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          {selected && (
            <Link className="text-link" href={`/projects/${id}/cuts`}>
              Open the cutting room{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
