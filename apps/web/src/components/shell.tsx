"use client";

import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { AccountControl } from "./session";
import { cloudMode } from "@/lib/supabase";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="rail" aria-label="Workspace navigation">
        <Link href="/" className="brand" aria-label="CreatorAi home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M5 21V11m6 15V6m5 17V9m5 11v-8m6 5v-2"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span>
            creator<span className="brand-ai">ai</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="rail-section">WORKSPACE</div>
        <nav>
          <Link href="/" className="nav-link" aria-current="page">
            <FolderOpen size={19} aria-hidden="true" />
            Projects
            <ArrowUpRight size={14} className="nav-arrow" aria-hidden="true" />
          </Link>
        </nav>
        <div className="rail-note">
          <div className="tiny-mark" aria-hidden="true">
            c.
          </div>
          <strong>Space to make things.</strong>
          <p>Your ideas, taking shape.</p>
        </div>
        <div className="rail-bottom">
          <span className="local-dot" aria-hidden="true" />
          {cloudMode ? "Your workspace" : "Local workspace"}
          <span className="version">02</span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>THE CREATOR’S WORKSPACE</span>
          <AccountControl />
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
