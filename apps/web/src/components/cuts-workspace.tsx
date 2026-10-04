"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scissors, Sparkles } from "lucide-react";
import { api, Asset, Capabilities, Project } from "@/lib/api";
import { Clip, Evidence, useRuns } from "@/lib/demo";
import { ProjectStages } from "./project-stages";
import { RunStatus } from "./run-status";
import { CutEditor } from "./cut-editor";

export function CutsWorkspace({ id }: { id: string }) {
  const jobs = useRuns(id);
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [instruction, setInstruction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  async function manualCut() {
    setManualBusy(true);
    setError("");
    try {
      const clip = await api<Clip>(`/projects/${id}/clips`, {
        method: "POST",
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          asset_id: sourceId,
        }),
      });
      setClips((values) => [clip, ...values]);
      setSelectedId(clip.id);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setManualBusy(false);
    }
  }
  const terminal = jobs.runs
    .filter((r) => ["review", "completed", "failed"].includes(r.status))
    .map((r) => `${r.id}:${r.status}`)
    .join();
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Project>(`/projects/${id}`, { signal: controller.signal }),
      api<Asset[]>(`/projects/${id}/assets`, { signal: controller.signal }),
      api<Capabilities>("/capabilities", { signal: controller.signal }),
    ])
      .then(([project, assets, capabilities]) => {
        setProject(project);
        setAssets(assets);
        setCapabilities(capabilities);
        setSourceId((current) => current || assets[0]?.id || "");
        setError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    api<Clip[]>(`/projects/${id}/clips`, { signal: controller.signal })
      .then((values) => {
        setClips(values);
        setSelectedId((current) => current || values[0]?.id || "");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [id, terminal, attempt]);
  useEffect(() => {
    if (!sourceId) return;
    const controller = new AbortController();
    api<{ ready: boolean; data: Evidence | null }>(
      `/assets/${sourceId}/analysis`,
      { signal: controller.signal },
    )
      .then((value) => setEvidence(value.data))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [sourceId, terminal]);
  const selected = clips.find((clip) => clip.id === selectedId);
  const asset = assets.find((asset) => asset.id === selected?.asset_id);
  const review = jobs.runs.find(
    (r) => r.kind === "clips" && r.status === "review",
  );
  const latest = jobs.runs.find((r) => r.kind !== "story");
  if (!project && error)
    return (
      <div className="page">
        <p className="notice error" role="alert">
          {error}
        </p>
        <button
          className="button secondary"
          onClick={() => setAttempt((v) => v + 1)}
        >
          Try again
        </button>
      </div>
    );
  if (!project || !capabilities)
    return (
      <div className="page loading" role="status">
        Opening your cutting room…
      </div>
    );
  return (
    <div className="page cuts-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} aria-hidden="true" />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT / CUTS</p>
          <h1>Find the moments.</h1>
          <p className="lede">
            {project.title} · A first edit, with your hands on the final cut.
          </p>
        </div>
      </div>
      <ProjectStages id={id} active="cuts" />
      <details className="agent-setup" open={clips.length === 0}>
        <summary>
          Find clips with the agent{" "}
          <span>Choose footage &amp; a direction</span>
        </summary>
        <section className="agent-brief" aria-label="Clip agent">
          <div className="agent-intro">
            <Scissors size={23} strokeWidth={1.5} aria-hidden="true" />
            <h2>
              A little footage.
              <br />A few good cuts.
            </h2>
            <p>
              The agent reads your story, searches the spoken moments, inspects
              frames, and brings back up to three proposals.
            </p>
          </div>
          <div className="agent-fields">
            <label className="field-label" htmlFor="agent-source">
              Source footage
            </label>
            <select
              id="agent-source"
              value={sourceId}
              disabled={jobs.active}
              onChange={(e) => {
                setSourceId(e.target.value);
                setEvidence(null);
              }}
            >
              {assets.length === 0 && (
                <option value="">Add footage in Material first</option>
              )}
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.filename} · {asset.duration.toFixed(0)}s
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="clip-direction">
              What should the clips say?
            </label>
            <textarea
              id="clip-direction"
              value={instruction}
              rows={2}
              maxLength={2000}
              placeholder="Find the strongest opening and one practical takeaway…"
              onChange={(e) => setInstruction(e.target.value)}
            />
            <div className="agent-actions">
              <button
                className="text-link"
                disabled={!sourceId || manualBusy || editDirty}
                onClick={() => void manualCut()}
              >
                {manualBusy ? "Opening a cut…" : "Start a cut myself"}
              </button>
              <button
                className="button primary"
                disabled={
                  !sourceId ||
                  !capabilities.ai_ready ||
                  jobs.active ||
                  jobs.busy
                }
                onClick={() =>
                  void jobs.start("clips", { asset_id: sourceId, instruction })
                }
              >
                <Sparkles size={16} aria-hidden="true" />
                Find my clips
              </button>
              <button
                className="text-link"
                disabled={
                  !sourceId ||
                  !capabilities.ai_ready ||
                  jobs.active ||
                  jobs.busy ||
                  Boolean(evidence)
                }
                onClick={() =>
                  void jobs.start("analyze", { asset_id: sourceId })
                }
              >
                {evidence ? "Footage index saved" : "Just understand footage"}
              </button>
            </div>
            {!capabilities.ai_ready && (
              <p className="small-note">
                Add the server’s Gemini key to enable the agent.
              </p>
            )}
            {assets.length === 0 && (
              <Link className="text-link" href={`/projects/${id}/material`}>
                Bring in your footage
              </Link>
            )}
          </div>
        </section>
      </details>
      {(error || jobs.error) && (
        <p className="notice error" role="alert">
          {error || jobs.error}
        </p>
      )}
      <RunStatus run={latest} busy={jobs.busy} action={jobs.action} />
      {evidence && (
        <details className="footage-index">
          <summary>
            What the footage contains <span>Saved audio + visual index</span>
          </summary>
          <p>{evidence.summary}</p>
          <p className="small-note">
            Timestamp estimates · Review against the source. {evidence.notes}
          </p>
          <div className="evidence-columns">
            <section>
              <h3>Spoken moments</h3>
              {evidence.transcript.length === 0 && (
                <p>No audible speech was indexed.</p>
              )}
              {evidence.transcript.map((segment, index) => (
                <p key={index}>
                  <span className="evidence-time">
                    {segment.start.toFixed(1)}–{segment.end.toFixed(1)}s
                  </span>
                  {segment.text}
                </p>
              ))}
            </section>
            <section>
              <h3>Sampled frames</h3>
              {evidence.visuals.map((frame, index) => (
                <p key={index}>
                  <span className="evidence-time">
                    {frame.time.toFixed(1)}s
                  </span>
                  {frame.description}
                </p>
              ))}
            </section>
          </div>
        </details>
      )}
      {review && (
        <section className="review-bar">
          <div>
            <span className="eyebrow">THE AGENT IS WAITING FOR YOU</span>
            <h2>Keep these cuts, or give it a nudge.</h2>
            <p>
              {String(
                review.output.coverage_notes ||
                  "Review the proposals and adjust anything you like.",
              )}
            </p>
          </div>
          <button
            className="button secondary"
            disabled={jobs.busy || jobs.active}
            onClick={() =>
              void jobs.action(review, "decision", { action: "approve" })
            }
          >
            Keep these proposals
          </button>
          <details>
            <summary>Ask the agent to revise</summary>
            <label className="field-label" htmlFor="review-feedback">
              What should change?
            </label>
            <textarea
              id="review-feedback"
              value={feedback}
              maxLength={2000}
              rows={2}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button
              className="button secondary"
              disabled={!feedback.trim() || jobs.busy || jobs.active}
              onClick={() =>
                void jobs.action(review, "decision", {
                  action: "revise",
                  feedback,
                })
              }
            >
              Revise with feedback
            </button>
          </details>
        </section>
      )}
      {clips.length > 0 ? (
        <div className="cutting-layout">
          <aside className="cut-list">
            <h2>
              Your cuts <span className="count">{clips.length}</span>
            </h2>
            {clips.map((clip, index) => (
              <button
                key={clip.id}
                className="cut-choice"
                aria-pressed={selectedId === clip.id}
                onClick={() => {
                  if (
                    !editDirty ||
                    window.confirm(
                      "Discard your unsaved edits and open this cut?",
                    )
                  ) {
                    setEditDirty(false);
                    setSelectedId(clip.id);
                  }
                }}
              >
                <span className="eyebrow">
                  CUT {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{clip.document.title}</strong>
                <span>
                  {clip.document.start.toFixed(1)}–
                  {clip.document.end.toFixed(1)}s · r{clip.revision}
                </span>
              </button>
            ))}
          </aside>
          {selected && asset && (
            <CutEditor
              clip={selected}
              key={selected.id}
              asset={asset}
              projectId={id}
              dirtyChanged={setEditDirty}
              saved={(value) =>
                setClips((clips) =>
                  clips.map((clip) => (clip.id === value.id ? value : clip)),
                )
              }
              exporting={jobs.active || jobs.busy}
              exportCut={(clip, preset) =>
                jobs.start("export", {
                  clip_id: clip.id,
                  clip_revision: clip.revision,
                  preset,
                })
              }
            />
          )}
        </div>
      ) : (
        <div className="cuts-empty">
          <span className="eyebrow">THE CUTTING ROOM</span>
          <h2>Your next good moment is in there.</h2>
          <p>
            Choose footage above and let the agent make the first pass. Every
            proposal stays editable.
          </p>
        </div>
      )}
    </div>
  );
}
