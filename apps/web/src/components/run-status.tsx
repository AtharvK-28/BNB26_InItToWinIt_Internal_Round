"use client";

import { LoaderCircle, Check, CircleAlert } from "lucide-react";
import { Run, working } from "@/lib/demo";

export function RunStatus({
  run,
  busy,
  action,
}: {
  run?: Run;
  busy: boolean;
  action: (run: Run, action: string) => Promise<void>;
}) {
  if (!run) return null;
  return (
    <section className="run-status" aria-label="Task activity">
      <div className="run-heading" role="status" aria-live="polite">
        {working(run) ? (
          <LoaderCircle size={18} className="spin" aria-hidden="true" />
        ) : run.status === "failed" ? (
          <CircleAlert size={18} aria-hidden="true" />
        ) : (
          <Check size={18} aria-hidden="true" />
        )}
        <strong>{run.stage}</strong>
        <span className="run-kind">
          {run.kind === "clips" ? "Clip agent" : run.kind}
        </span>
      </div>
      {run.error && (
        <p className="field-error" role="alert">
          {run.error}
        </p>
      )}
      {run.events.length > 0 && (
        <details>
          <summary>See tool activity</summary>
          <ol>
            {run.events.map((event, index) => (
              <li key={`${event.time}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {event.message}
              </li>
            ))}
          </ol>
        </details>
      )}
      {(run.status === "failed" || run.status === "cancelled") && (
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void action(run, "retry")}
        >
          Retry saved task
        </button>
      )}
      {working(run) && (
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void action(run, "cancel")}
        >
          Stop task
        </button>
      )}
    </section>
  );
}
