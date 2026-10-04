"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Save, ArrowUpRight } from "lucide-react";
import { api, Asset, MediaLinks, mediaUrl } from "@/lib/api";
import { Clip, Edit, Preset, presets } from "@/lib/demo";
import { CoverEditor } from "./cover-editor";
import { useWorkspaceIdentity } from "./session";

export function CutEditor({
  clip,
  asset,
  projectId,
  saved: onSaved,
  exporting,
  exportCut,
  dirtyChanged,
}: {
  clip: Clip;
  asset: Asset;
  projectId: string;
  saved: (clip: Clip) => void;
  exporting: boolean;
  exportCut: (clip: Clip, preset: Preset) => Promise<unknown>;
  dirtyChanged: (value: boolean) => void;
}) {
  const [document, setDocument] = useState<Edit>(clip.document);
  const [saved, setSaved] = useState(clip);
  const [preset, setPreset] = useState<Preset>("youtube_shorts");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<MediaLinks | null>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [position, setPosition] = useState(document.start);
  const video = useRef<HTMLVideoElement>(null);
  const identity = useWorkspaceIdentity();
  const recoveryKey = `creatorai:cut:${identity}:${clip.id}`;
  const [recoveryLoaded, setRecoveryLoaded] = useState(false);
  const dirty = JSON.stringify(document) !== JSON.stringify(saved.document);
  const valid =
    document.title.trim() &&
    document.start >= 0 &&
    document.end <= asset.duration &&
    document.end > document.start &&
    document.end - document.start <= 60;
  const currentCaption = document.subtitle_segments.find(
    (s) => s.start <= position && s.end > position,
  )?.text;
  useEffect(() => dirtyChanged(dirty), [dirty, dirtyChanged]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(recoveryKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (
          draft.document &&
          typeof draft.document.title === "string" &&
          Array.isArray(draft.document.subtitle_segments) &&
          draft.document.cover
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the browser-owned draft once
          setDocument(draft.document);
          setMessage("Recovered your unsaved edit from this tab.");
          if (draft.revision !== clip.revision)
            setError(
              "This recovered edit is from an older revision. Download it before loading the latest cut.",
            );
        }
      }
    } catch {
      /* Browser storage is optional. */
    }
    setRecoveryLoaded(true);
  }, [recoveryKey, clip.revision]);
  useEffect(() => {
    if (!recoveryLoaded) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          recoveryKey,
          JSON.stringify({ document, revision: saved.revision }),
        );
      else sessionStorage.removeItem(recoveryKey);
    } catch {
      /* Saving to the API still works if browser storage is unavailable. */
    }
  }, [recoveryLoaded, recoveryKey, document, dirty, saved.revision]);
  useEffect(() => {
    const controller = new AbortController();
    api<MediaLinks>(`/assets/${asset.id}/links`, { signal: controller.signal })
      .then(setLinks)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [asset.id, previewAttempt]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function edit(fields: Partial<Edit>) {
    setDocument((value) => ({ ...value, ...fields }));
    setMessage("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const value = await api<Clip>(`/clips/${saved.id}`, {
        method: "PUT",
        body: JSON.stringify({ revision: saved.revision, document }),
      });
      setSaved(value);
      setDocument(value.document);
      onSaved(value);
      setMessage("Your edit is saved.");
      try {
        sessionStorage.removeItem(recoveryKey);
      } catch {}
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="cut-editor" aria-label="Edit selected cut">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">YOUR EDIT / REVISION {saved.revision}</span>
          <h2>{saved.document.title}</h2>
        </div>
        <span className="save-status" role="status">
          {dirty ? "Unsaved edits" : "Saved"}
        </span>
      </div>
      <div className="edit-preview-row">
        <div
          className={`cut-preview ${preset === "youtube_video" ? "landscape" : "portrait"}`}
        >
          {links ? (
            <video
              ref={video}
              src={mediaUrl(links.original)}
              poster={mediaUrl(links.thumbnail)}
              controls
              playsInline
              preload="metadata"
              style={{ objectPosition: `${document.crop_x * 100}% center` }}
              onLoadedMetadata={() => {
                if (video.current) video.current.currentTime = document.start;
              }}
              onTimeUpdate={(event) => {
                setPosition(event.currentTarget.currentTime);
                if (
                  !event.currentTarget.paused &&
                  event.currentTarget.currentTime >= document.end
                )
                  event.currentTarget.pause();
              }}
              onError={() =>
                setError("The source preview expired. Refresh it below.")
              }
            />
          ) : (
            <p role="status">Opening footage…</p>
          )}
          {document.subtitles && currentCaption && (
            <div className="caption-preview" aria-hidden="true">
              {currentCaption}
            </div>
          )}
        </div>
        <div className="edit-evidence">
          <span className="eyebrow">WHY THIS MOMENT</span>
          <p>{document.rationale || "A cut from your original footage."}</p>
          {document.source_quote && (
            <blockquote>“{document.source_quote}”</blockquote>
          )}
          {document.script_match && (
            <>
              <h3>Story connection</h3>
              <p>{document.script_match}</p>
            </>
          )}
          <button
            className="button secondary"
            disabled={!links || !valid}
            onClick={() => {
              if (video.current) {
                video.current.currentTime = document.start;
                void video.current
                  .play()
                  .catch(() =>
                    setError("Press the video play control to preview."),
                  );
              }
            }}
          >
            <Play size={15} aria-hidden="true" />
            Play this cut
          </button>
          <button
            className="text-link"
            onClick={() => {
              setLinks(null);
              setPreviewAttempt((value) => value + 1);
            }}
          >
            Refresh source preview
          </button>
          <p className="small-note">
            Preview uses your original. Saved crops and captions are applied
            during export.
          </p>
        </div>
      </div>
      <div className="cut-track" aria-label="Cut position in source footage">
        <span
          style={{
            left: `${(document.start / asset.duration) * 100}%`,
            width: `${((document.end - document.start) / asset.duration) * 100}%`,
          }}
        />
      </div>
      <div className="trim-fields">
        <label>
          Start · seconds
          <input
            type="number"
            step={0.1}
            min={0}
            max={asset.duration}
            value={document.start}
            onChange={(e) => edit({ start: Number(e.target.value) })}
          />
        </label>
        <label>
          End · seconds
          <input
            type="number"
            step={0.1}
            min={0}
            max={asset.duration}
            value={document.end}
            onChange={(e) => edit({ end: Number(e.target.value) })}
          />
        </label>
        <p>
          <strong>
            {Math.max(0, document.end - document.start).toFixed(1)}s
          </strong>
          <span>of {asset.duration.toFixed(1)}s source</span>
        </p>
      </div>
      {!valid && (
        <p className="field-error" role="alert">
          Give the cut a title and choose a forward range, up to 60 seconds,
          inside the source.
        </p>
      )}
      <label className="field-label" htmlFor="cut-title">
        Title
      </label>
      <input
        id="cut-title"
        value={document.title}
        maxLength={100}
        onChange={(e) => edit({ title: e.target.value })}
      />
      <label className="field-label" htmlFor="cut-hook">
        Opening hook
      </label>
      <input
        id="cut-hook"
        value={document.hook}
        maxLength={300}
        onChange={(e) => edit({ hook: e.target.value })}
      />
      <label className="field-label" htmlFor="crop">
        Frame position · {Math.round(document.crop_x * 100)}%
      </label>
      <input
        id="crop"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={document.crop_x}
        onChange={(e) => edit({ crop_x: Number(e.target.value) })}
      />
      <label className="field-label" htmlFor="cut-caption">
        Post caption
      </label>
      <textarea
        id="cut-caption"
        rows={3}
        value={document.caption}
        maxLength={2200}
        onChange={(e) => edit({ caption: e.target.value })}
      />
      <details className="editor-detail">
        <summary>
          Captions &amp; timing{" "}
          <span>{document.subtitle_segments.length} segments</span>
        </summary>
        <label className="check-control">
          <input
            type="checkbox"
            checked={document.subtitles}
            onChange={(e) => edit({ subtitles: e.target.checked })}
          />
          Burn captions into the export
        </label>
        <p className="small-note">
          AI timings are estimates. Listen to the source and adjust them before
          exporting. Times refer to the original footage.
        </p>
        {document.subtitle_segments.map((segment, index) => (
          <div className="caption-row" key={index}>
            <label>
              <span>Start {index + 1}</span>
              <input
                type="number"
                min={0}
                max={asset.duration}
                step={0.1}
                value={segment.start}
                onChange={(e) =>
                  edit({
                    subtitle_segments: document.subtitle_segments.map((s, i) =>
                      i === index ? { ...s, start: Number(e.target.value) } : s,
                    ),
                  })
                }
              />
            </label>
            <label>
              <span>End {index + 1}</span>
              <input
                type="number"
                min={0}
                max={asset.duration}
                step={0.1}
                value={segment.end}
                onChange={(e) =>
                  edit({
                    subtitle_segments: document.subtitle_segments.map((s, i) =>
                      i === index ? { ...s, end: Number(e.target.value) } : s,
                    ),
                  })
                }
              />
            </label>
            <label className="caption-text">
              <span>Caption {index + 1}</span>
              <textarea
                rows={2}
                maxLength={500}
                value={segment.text}
                onChange={(e) =>
                  edit({
                    subtitle_segments: document.subtitle_segments.map((s, i) =>
                      i === index ? { ...s, text: e.target.value } : s,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
      </details>
      <details className="editor-detail">
        <summary>
          Design the cover <span>2 editable text layers</span>
        </summary>
        <CoverEditor
          cover={document.cover}
          thumbnail={links ? mediaUrl(links.thumbnail) : undefined}
          change={(cover) => edit({ cover })}
        />
      </details>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="recovery-note" role="status">
          {message}
        </p>
      )}
      <div className="edit-actions">
        <button
          className="button primary"
          disabled={busy || !dirty || !valid}
          onClick={() => void save()}
        >
          <Save size={16} aria-hidden="true" />
          {busy ? "Saving…" : "Save edit"}
        </button>
        <button
          className="text-link"
          disabled={!dirty || busy}
          onClick={() => {
            setDocument(saved.document);
            setError("");
          }}
        >
          Undo unsaved edits
        </button>
        <button
          className="text-link"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob(
                [
                  JSON.stringify(
                    {
                      version: 1,
                      asset_id: asset.id,
                      revision: saved.revision,
                      document,
                    },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              ),
            );
            const link = window.document.createElement("a");
            link.href = url;
            link.download = "creatorai-edit.json";
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Download current edit
        </button>
      </div>
      <div className="export-action">
        <div>
          <label className="field-label" htmlFor="export-preset">
            Make it fit
          </label>
          <select
            id="export-preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value as Preset)}
          >
            {Object.entries(presets).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <p className="small-note">
            720p MP4 + captions, editable cut plan, and layered cover.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={dirty || busy || exporting || !valid}
          onClick={() => void exportCut(saved, preset)}
        >
          <ArrowUpRight size={16} aria-hidden="true" />
          Export saved cut
        </button>
      </div>
      <Link className="text-link" href={`/projects/${projectId}/deliver`}>
        Open your delivery shelf <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}
