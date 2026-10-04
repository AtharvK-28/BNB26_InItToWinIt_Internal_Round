"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { api, mediaUrl, Project } from "@/lib/api";
import { Delivery, presets, Preset, useRuns } from "@/lib/demo";
import { ProjectStages } from "./project-stages";
import { RunStatus } from "./run-status";

function ExportCard({ item }: { item: Delivery }) {
  const [links, setLinks] = useState<{ video: string; package: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ video: string; package: string }>(`/exports/${item.id}/links`, {
      signal: controller.signal,
    })
      .then((value) => {
        setLinks(value);
        setError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [item.id, attempt]);
  return (
    <article className="delivery-item">
      <div className="delivery-player">
        {links && (
          <video
            src={mediaUrl(links.video)}
            controls
            playsInline
            preload="metadata"
            onError={() => setError("Refresh the links to play this export.")}
          />
        )}
      </div>
      <div className="delivery-copy">
        <span className="eyebrow">READY TO TAKE WITH YOU</span>
        <h2>{presets[item.preset as Preset] ?? item.preset}</h2>
        <p>
          {item.duration.toFixed(1)} seconds ·{" "}
          {(item.bytes / 1024 / 1024).toFixed(1)} MB · saved edit r
          {item.clip_revision}
        </p>
        <p>
          The MP4 is ready to upload. The package includes your cut plan,
          caption file, subtitles, and an SVG cover with movable text layers.
        </p>
        {links && (
          <div className="delivery-actions">
            <a
              className="button primary"
              href={mediaUrl(links.video)}
              download="creatorai.mp4"
            >
              <Download size={16} aria-hidden="true" />
              Video MP4
            </a>
            <a
              className="button secondary"
              href={mediaUrl(links.package)}
              download="creatorai-editable.zip"
            >
              Editable package
            </a>
          </div>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="text-link"
          onClick={() => {
            setLinks(null);
            setAttempt((value) => value + 1);
          }}
        >
          Refresh download links
        </button>
        <p className="small-note">
          Private links last five minutes. Publishing happens in your platform
          account.
        </p>
      </div>
    </article>
  );
}

export function DeliveryWorkspace({ id }: { id: string }) {
  const jobs = useRuns(id);
  const [project, setProject] = useState<Project | null>(null);
  const [exports, setExports] = useState<Delivery[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const completed = jobs.runs
    .filter((r) => r.kind === "export" && r.status === "completed")
    .map((r) => r.id)
    .join();
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Project>(`/projects/${id}`, { signal: controller.signal }),
      api<Delivery[]>(`/projects/${id}/exports`, { signal: controller.signal }),
    ])
      .then(([project, items]) => {
        setProject(project);
        setExports(items);
        setError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [id, completed, attempt]);
  if (!project && !error)
    return (
      <div className="page loading" role="status">
        Opening your delivery shelf…
      </div>
    );
  return (
    <div className="page delivery-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} aria-hidden="true" />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT / DELIVER</p>
          <h1>Ready for the outside world.</h1>
          <p className="lede">
            {project?.title} · Your exports, with the editable originals
            alongside.
          </p>
        </div>
        <Link className="button secondary" href={`/projects/${id}/cuts`}>
          Back to cuts <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <ProjectStages id={id} active="deliver" />
      {(error || jobs.error) && (
        <div className="notice error" role="alert">
          <p>{error || jobs.error}</p>
          <button
            className="text-link"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      )}
      <RunStatus
        run={jobs.runs.find((r) => r.kind === "export")}
        busy={jobs.busy}
        action={jobs.action}
      />
      {exports.length ? (
        <div className="delivery-list">
          {exports.map((item) => (
            <ExportCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="cuts-empty">
          <span className="eyebrow">A SPACE FOR THE FINISHED PIECES</span>
          <h2>When it feels right, export it.</h2>
          <p>
            Save a cut and choose YouTube Shorts, Instagram Reels, or a
            landscape YouTube video.
          </p>
          <Link className="text-link" href={`/projects/${id}/cuts`}>
            Open the cutting room <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
