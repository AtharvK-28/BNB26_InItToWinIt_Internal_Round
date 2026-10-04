"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Project } from "@/lib/api";
import { ProjectForm } from "./project-form";

export function ProjectLoader({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<Project>(`/projects/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then((result) => {
        setProject(result);
        setError("");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [id, attempt]);
  if (error)
    return (
      <div className="page">
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
          <Link className="text-link" href="/">
            All projects
          </Link>
        </div>
      </div>
    );
  if (!project || project.id !== id)
    return (
      <div className="page loading" role="status">
        Opening your story…
      </div>
    );
  return <ProjectForm project={project} key={project.id} />;
}
