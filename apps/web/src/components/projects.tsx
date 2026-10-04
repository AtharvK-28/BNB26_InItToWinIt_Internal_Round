"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api, Project, updatedLabel } from "@/lib/api";

export function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api<Project[]>("/projects", { signal: controller.signal })
      .then((data) => {
        setProjects(data);
        setError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const visible = projects?.filter((project) =>
    project.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR STUDIO / PROJECTS</p>
          <h1>Good stories start here.</h1>
          <p className="lede">
            A little structure. A lot of room for your ideas.
          </p>
        </div>
        <Link className="button primary" href="/projects/new">
          <Plus size={18} aria-hidden="true" />
          New project
        </Link>
      </div>
      <section className="projects-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <h2 id="projects-title">
            On your desk{" "}
            {projects && <span className="count">{projects.length}</span>}
          </h2>
          {Boolean(projects?.length) && (
            <label className="search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a project"
                type="search"
              />
            </label>
          )}
        </div>
        {error ? (
          <div className="notice error" role="alert">
            <p>{error}</p>
            <button
              className="button secondary"
              onClick={() => {
                setError("");
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : !projects ? (
          <div className="loading" role="status">
            Opening your workspace…
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-desk">
            <div className="folio-art" aria-hidden="true">
              <div className="folio-back" />
              <div className="folio-sheet">
                <span className="folio-label">UNTITLED, FOR NOW</span>
                <div className="folio-lines">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="folio-symbol">
                  <FileText strokeWidth={1.2} size={42} />
                </div>
                <span className="folio-foot">
                  Every project starts with a thought.
                </span>
              </div>
              <span className="folio-tab">01</span>
            </div>
            <div className="empty-copy">
              <p className="eyebrow">A CLEAN SLATE</p>
              <h2>
                What are you
                <br />
                working on next?
              </h2>
              <p>
                Start with a title and a rough idea.
                <br className="desktop-break" /> You can figure out the rest as
                you go.
              </p>
              <Link className="text-link" href="/projects/new">
                Start your first project{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : visible?.length === 0 ? (
          <div className="empty-search">
            <h3>No projects with that title.</h3>
            <button className="text-link" onClick={() => setQuery("")}>
              Clear search <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="project-list">
            {visible?.map((project, index) => (
              <Link
                href={`/projects/${project.id}`}
                className="project-row"
                key={project.id}
              >
                <div className="project-number">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="project-summary">
                  <h3>{project.title}</h3>
                  <p>
                    {project.brief.trim() ||
                      "The beginning of something. Add your first thought."}
                  </p>
                </div>
                <div className="project-meta">
                  <span>
                    {project.platforms
                      .map((p) => (p === "youtube" ? "YouTube" : "Instagram"))
                      .join(" · ")}
                  </span>
                  <span>Edited {updatedLabel(project.updated_at)}</span>
                </div>
                <ArrowUpRight size={21} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="process-note" aria-label="How a project takes shape">
        <div>
          <span className="eyebrow">THE PATH AHEAD</span>
          <p>One project. From idea to output.</p>
        </div>
        <ol>
          {["Material", "Story", "Cuts", "Deliver"].map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
              {index < 3 && <ArrowRight size={14} aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <span className="process-caption">
          Start with a clip or a rough story.
        </span>
      </section>
    </div>
  );
}
