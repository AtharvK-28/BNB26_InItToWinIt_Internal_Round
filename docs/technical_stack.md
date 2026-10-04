# Technical stack and multi-agent direction

Updated: 4 October 2026. Free-first prototype; current source code and requirements below replace the earlier paid/GPU/editor-heavy baseline. Multi-agent coordination is the next implementation increment, not already complete.

## Active stack

| Layer | Implemented technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js 16.3.8, React 19.2.8, TypeScript; Node 24 / pnpm | Project workspace, brief, source/candidate review, progress and downloads |
| Design | Native CSS tokens, bundled Manrope/DM Sans, Lucide | Bespoke studio identity and accessible controls |
| Backend | Python 3.12, FastAPI, Pydantic, Uvicorn | Authenticated APIs, domain rules, schema validation and job submission |
| Persistence | Supabase Postgres, SQLAlchemy, psycopg, Alembic | Projects, assets, evidence, runs, cuts and exports; private schemas |
| Authentication / files | Supabase Auth and private Storage | Verified JWT identity, tenant isolation and expiring media links |
| Reasoning | Gemini Flash through the server-only Interactions adapter | Drafting, interpretation and bounded tool decisions |
| Agent runtime | LangGraph with Postgres checkpoints; SQLite locally | Currently one clip agent; target coordinator plus specialist subgraphs |
| Execution | Postgres-backed queue, worker claims/heartbeats/leases | Durable work without a separate broker; one designated shared-demo worker |
| Media | FFmpeg / FFprobe | Metadata, sampled frames/audio and deterministic MP4/package rendering |
| Hosting preparation | Vercel frontend, Render Docker API | Public releases are pending; worker can run with API or separately |

Actual env names and tested model settings live in services/api/.env.example and apps/web/.env.example. There is no Celery/Valkey, Modal, vector embedding pipeline, Tiptap, Konva, dnd-kit, TanStack Query or Zustand prerequisite in the current build. Earlier research on those technologies does not make them installed dependencies.

## Multi-agent upgrade

Use the same LangGraph library, worker, Gemini adapter and database. Introduce Story Agent, Footage Research Agent and Clip Director with distinct objectives/tool policies, separate decision state and typed handoffs. A coordinator routes work and enforces a shared budget. Details and acceptance checks are in agents_and_workflows.md.

Specialists exchange story/evidence/clip references instead of resending whole footage. Extract existing search/inspection and proposal logic into subgraphs. No additional paid framework or separate server per agent is necessary. Deterministic rendering and platform presets remain tools/jobs, not agents.

## Service boundaries

Next.js owns presentation; it does not run long agent loops or FFmpeg. FastAPI verifies identity, checks ownership, freezes input versions and validates requests. LangGraph coordinates adaptive specialist decisions and review pauses. The job worker handles execution and recoverable leases. Supabase stores product state, private media and checkpoints. FFmpeg receives validated argument lists from trusted Python code, never a model-generated shell command.

The footage index currently uses audio and eight sampled frames, with source-linked transcript/observations and provenance. Cached evidence and bounded selected-window inspection remain the free-first route. Accurate alignment, richer retrieval and tracking are optional future upgrades after measured need.

## Output contract, not an editor stack

Keep a versioned source-linked cut plan and platform export plan. Render MP4 and export JSON/SRT/copy/layered SVG for external editing. No embedded video/image editor or editor SDK is selected for this scope. Existing experimental editing components can be de-emphasized in a later UI change; documentation changes do not remove their code.

## Deployment constraints

Cloud mode requires Supabase Auth/Postgres/private Storage. Local mode uses SQLite/local files and is loopback-only. Free sleeping hosts pause worker progress; durable storage preserves jobs. Public deployment and the Docker image still require host-side verification. Share configuration using collaborator_setup.md and human_setup.md; never commit credentials.
