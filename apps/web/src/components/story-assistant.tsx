"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api, Capabilities, Project } from "@/lib/api";
import { Story, useRuns } from "@/lib/demo";
import { RunStatus } from "./run-status";

export function StoryAssistant({
  project,
  dirty,
  apply,
}: {
  project: Project;
  dirty: boolean;
  apply: (text: string) => void;
}) {
  const jobs = useRuns(project.id);
  const [direction, setDirection] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api<Capabilities>("/capabilities")
      .then((value) => setReady(value.ai_ready))
      .catch(() => setReady(false));
  }, []);
  const run = jobs.runs.find((value) => value.kind === "story");
  const draft =
    run?.status === "completed" ? (run.output as unknown as Story) : null;
  return (
    <section className="story-assistant">
      <span className="eyebrow">A SECOND PAIR OF EYES</span>
      <h3>Find the opening.</h3>
      <p>
        Three hooks, a working script, and a caption. You choose what makes it
        into your story.
      </p>
      <label className="field-label" htmlFor="story-direction">
        A little direction
      </label>
      <textarea
        id="story-direction"
        value={direction}
        maxLength={2000}
        rows={3}
        placeholder="Keep it conversational. Lead with the surprising part…"
        onChange={(event) => setDirection(event.target.value)}
      />
      {dirty && (
        <p className="small-note">
          Save your story first so the assistant uses your latest words.
        </p>
      )}
      {!ready && (
        <p className="small-note">AI is waiting for the server’s Gemini key.</p>
      )}
      <button
        className="button secondary"
        disabled={!ready || dirty || jobs.busy || jobs.active}
        onClick={() => void jobs.start("story", { instruction: direction })}
      >
        <Sparkles size={16} aria-hidden="true" />
        Draft hooks &amp; script
      </button>
      {jobs.error && (
        <p className="field-error" role="alert">
          {jobs.error}
        </p>
      )}
      <RunStatus run={run} busy={jobs.busy} action={jobs.action} />
      {draft && (
        <div className="story-results">
          <h3>Three ways in</h3>
          {draft.hooks.map((hook, index) => (
            <div className="hook-result" key={index}>
              <span className="eyebrow">
                0{index + 1} / {hook.angle}
              </span>
              <p>{hook.text}</p>
              <button
                className="text-link"
                onClick={() => apply(`${hook.text}\n\n${draft.script}`)}
              >
                Use this opening &amp; script
              </button>
            </div>
          ))}
          <details>
            <summary>Read the script &amp; supporting copy</summary>
            <p className="preserve-lines">{draft.script}</p>
            <h4>Title options</h4>
            <ul>
              {draft.titles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
            <h4>Caption</h4>
            <p className="preserve-lines">{draft.caption}</p>
          </details>
        </div>
      )}
    </section>
  );
}
