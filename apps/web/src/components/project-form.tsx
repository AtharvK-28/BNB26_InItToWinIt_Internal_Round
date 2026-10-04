"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, Platform, Project } from "@/lib/api";
import { ProjectStages } from "./project-stages";
import { useWorkspaceIdentity } from "./session";
import { StoryAssistant } from "./story-assistant";

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [title, setTitle] = useState(project?.title ?? "");
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(
    project?.platforms ?? ["youtube", "instagram"],
  );
  const [saved, setSaved] = useState(project);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recoveryLoaded, setRecoveryLoaded] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const identity = useWorkspaceIdentity();
  const recoveryKey = `creatorai:draft:${identity}:${project?.id ?? "new"}`;
  const dirty =
    title !== (saved?.title ?? "") ||
    brief !== (saved?.brief ?? "") ||
    platforms.join() !== (saved?.platforms ?? ["youtube", "instagram"]).join();
  const invalidTitle = titleTouched && !title.trim();

  useEffect(() => {
    // Restore browser-owned state after hydration; never overwrite an older server revision.
    try {
      const raw = sessionStorage.getItem(recoveryKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (
          typeof draft.title === "string" &&
          typeof draft.brief === "string" &&
          Array.isArray(draft.platforms) &&
          draft.platforms.every((value: string) =>
            ["youtube", "instagram"].includes(value),
          )
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time external draft restoration
          setTitle(draft.title.slice(0, 120));
          setBrief(draft.brief.slice(0, 20000));
          setPlatforms([...new Set(draft.platforms)] as Platform[]);
          setRecovered(true);
          if (project && draft.revision !== project.revision) {
            setConflict(true);
            setError(
              "Your recovered draft is from an older version. Download it before loading the latest saved story.",
            );
          }
        }
      }
    } catch {
      /* Browser storage may be disabled; saving still works. */
    }
    setRecoveryLoaded(true);
  }, [recoveryKey, project]);

  useEffect(() => {
    if (!recoveryLoaded) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          recoveryKey,
          JSON.stringify({
            title,
            brief,
            platforms,
            revision: saved?.revision ?? 0,
          }),
        );
      else sessionStorage.removeItem(recoveryKey);
    } catch {
      /* Private browsing/storage quotas cannot block editing. */
    }
  }, [title, brief, platforms, dirty, saved, recoveryKey, recoveryLoaded]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async () => {
    setTitleTouched(true);
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (platforms.length === 0) {
      setError("Select at least one destination for this project.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (busy || conflict || (saved && !dirty)) return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const result = await api<Project>(
        saved ? `/projects/${saved.id}` : "/projects",
        {
          method: saved ? "PUT" : "POST",
          body: JSON.stringify({
            title,
            brief,
            platforms,
            ...(saved ? { revision: saved.revision } : {}),
          }),
        },
      );
      setSaved(result);
      setTitle(result.title);
      setSuccess(true);
      setRecovered(false);
      try {
        sessionStorage.removeItem(recoveryKey);
      } catch {}
      if (!saved) router.push(`/projects/${result.id}`);
    } catch (error) {
      setError((error as Error).message);
      if (error instanceof ApiError && error.status === 409) setConflict(true);
    } finally {
      setBusy(false);
    }
  }, [
    title,
    brief,
    platforms,
    busy,
    conflict,
    saved,
    dirty,
    router,
    recoveryKey,
  ]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [save]);

  function togglePlatform(platform: Platform) {
    setPlatforms((value) =>
      value.includes(platform)
        ? value.filter((item) => item !== platform)
        : [...value, platform],
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void save();
  }
  function downloadDraft() {
    const url = URL.createObjectURL(
      new Blob([`${title}\n\n${brief}`], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "creatorai-draft.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page project-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {project ? "PROJECT / STORY" : "A NEW BEGINNING"}
          </p>
          <h1>{project ? "Shape the story." : "Give your idea a home."}</h1>
          <p className="lede">
            {project
              ? "Keep the thought, the angle, and the rough script together."
              : "A working title is enough. Nothing has to be perfect yet."}
          </p>
        </div>
      </div>
      {project && <ProjectStages id={project.id} active="story" />}
      <div className="writing-layout">
        <form className="writing-panel" onSubmit={submit}>
          <div className="panel-heading">
            <span className="eyebrow">
              {project ? "THE WORKING DRAFT" : "PROJECT DETAILS"}
            </span>
            {project && (
              <span className="save-status" role="status">
                {busy
                  ? "Saving…"
                  : dirty
                    ? "Unsaved changes"
                    : success
                      ? "Saved"
                      : "All changes saved"}
              </span>
            )}
          </div>
          {recovered && (
            <p className="recovery-note" role="status">
              Your unsaved working copy was recovered from this tab.
            </p>
          )}
          <label className="field-label" htmlFor="title">
            Working title <span>Required</span>
          </label>
          <input
            id="title"
            name="title"
            autoComplete="off"
            ref={titleRef}
            className="title-input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSuccess(false);
            }}
            onBlur={() => setTitleTouched(true)}
            maxLength={120}
            aria-required="true"
            aria-invalid={invalidTitle}
            aria-describedby={invalidTitle ? "title-error" : undefined}
            placeholder="A story worth telling…"
            disabled={busy}
          />
          {invalidTitle && (
            <p className="field-error" id="title-error">
              Give your project a title so you can find it later.
            </p>
          )}
          <label className="field-label brief-label" htmlFor="brief">
            The idea &amp; rough script <span>Optional</span>
          </label>
          <textarea
            id="brief"
            name="brief"
            autoComplete="off"
            value={brief}
            onChange={(event) => {
              setBrief(event.target.value);
              setSuccess(false);
            }}
            maxLength={20000}
            disabled={busy}
            placeholder={
              "What’s the story? Who’s it for?\n\nAn opening line, a few beats, or a messy first draft…"
            }
          />
          <div className="writing-bottom">
            <span>
              {brief.trim() ? brief.trim().split(/\s+/).length : 0} words
            </span>
            <span>Room for a rough first draft.</span>
          </div>
          <fieldset className="platforms" disabled={busy}>
            <legend>Where will it live?</legend>
            <p>Choose one or both. You can change this later.</p>
            <div className="platform-options">
              {(["youtube", "instagram"] as Platform[]).map((platform) => (
                <label className="platform-option" key={platform}>
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                  />
                  <span>
                    {platform === "youtube" ? "YouTube" : "Instagram"}
                  </span>
                  <span className="platform-format">
                    {platform === "youtube" ? "Video & Shorts" : "Reels"}
                  </span>
                </label>
              ))}
            </div>
            {platforms.length === 0 && (
              <p className="field-error" role="alert">
                Select at least one platform.
              </p>
            )}
          </fieldset>
          {error && (
            <div
              className="notice error"
              role="alert"
              ref={errorRef}
              tabIndex={-1}
            >
              <p>{error}</p>
              {conflict && (
                <>
                  <p>
                    Your text stays here. Save a copy before loading the latest
                    version.
                  </p>
                  <div className="conflict-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={downloadDraft}
                    >
                      Download draft
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        try {
                          sessionStorage.removeItem(recoveryKey);
                        } catch {}
                        window.location.reload();
                      }}
                    >
                      Load latest
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="form-actions">
            <span className="save-hint">
              {project
                ? "Save whenever you’re ready."
                : "Just the beginning. You’re in control."}
            </span>
            <button
              className="button primary"
              type="submit"
              disabled={busy || conflict || (Boolean(project) && !dirty)}
            >
              {busy ? (
                <LoaderCircle size={17} className="spin" aria-hidden="true" />
              ) : project ? (
                success && !dirty ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <Save size={17} aria-hidden="true" />
                )
              ) : (
                <ArrowRight size={17} aria-hidden="true" />
              )}
              {busy ? "Saving…" : project ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
        <aside className="writing-aside">
          {saved && (
            <StoryAssistant
              project={saved}
              dirty={dirty}
              apply={(text) => {
                setBrief(text);
                setSuccess(false);
              }}
            />
          )}
          <span className="aside-index">02 / STORY</span>
          <h2>
            Start rough.
            <br />
            Make it yours.
          </h2>
          <p>
            Write the way you think. A few notes today can become the opening to
            your next video.
          </p>
          <div className="aside-rule" />
          <h3>A useful starting point</h3>
          <ul>
            <li>What should someone take away?</li>
            <li>What makes your angle different?</li>
            <li>What would you say in the first five seconds?</li>
          </ul>
          <div className="future-note">
            <strong>Bring the material with you.</strong>
            <p>Your footage and this draft live in the same project.</p>
            {project && (
              <Link
                className="text-link"
                href={`/projects/${project.id}/material`}
              >
                Open material <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
