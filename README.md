# CreatorAi

### AI-powered content operations for creators

CreatorAi brings a creator's ideas, scripts and footage into one workspace and helps turn them into useful, platform-ready content. It connects what the creator wants to say with what actually exists in their footage, proposes short clips with supporting evidence, and keeps the creator in control through review and revision.

The product is being developed toward a coordinated multi-agent workflow. The current prototype already supports real footage analysis, a tool-using clip agent, creator review and video exports; the specialist-agent handoffs are the next implementation milestone.

## The problem

Content production is scattered across writing tools, asset folders, editing applications and publishing platforms. Creators repeatedly search through recordings, rewrite hooks and prepare different versions of the same content.

CreatorAi connects those steps around a project: keep the source material together, understand it once, find the moments that support the story, and prepare outputs for the intended platforms.

## The creator workflow

| Stage | What the creator does | What CreatorAi provides |
| --- | --- | --- |
| **Material** | Upload footage and organize it in a project | Private originals, thumbnails, metadata and reusable audio/visual analysis |
| **Story** | Add an idea, brief or existing script | Suggested hooks, a working script, titles and supporting copy for explicit acceptance |
| **Cuts** | Ask for useful moments and review the proposals | Source-linked candidates, transcript quotes, visual evidence and a revision/approval step |
| **Deliver** | Choose an output format and approve the result | Rendered MP4 and a portable package containing structured edit instructions and supporting files |

Creators can begin with a script or with existing footage. The goal is one connected production flow, with a small set of useful candidates and clear next actions.

## What makes the workflow useful

- **Source-grounded proposals:** clips refer to actual footage ranges, speech and inspected visual windows. Missing evidence is surfaced rather than invented.
- **Reusable understanding:** a saved footage index avoids analyzing the same source for every request.
- **Creator control:** AI results are staged for review; accepting a suggestion is explicit, and newer creator work is not silently overwritten.
- **Recoverable work:** jobs and agent checkpoints persist so an interrupted workflow can resume.
- **Platform adaptation:** exports support YouTube Shorts, Instagram Reels and a landscape YouTube preset.
- **Editable outputs:** originals and structured production instructions remain available alongside the finished video.

## Multi-agent direction

The target system separates creative responsibilities into specialist agents coordinated through LangGraph:

| Agent | Responsibility |
| --- | --- |
| **Story Agent** | Draft and revise hooks, scripts and supporting copy using the brief and available source facts |
| **Footage Research Agent** | Search timestamped speech, inspect relevant visual windows and report evidence or missing matches |
| **Clip Director** | Choose coherent moments, connect them to the approved story and request more research when necessary |

A coordinating workflow manages typed handoffs, saved state, shared usage budgets and creator review. Extraction, validation, platform presets and rendering remain deterministic jobs.

**Implementation status:** the runtime currently has one adaptive clip agent plus separate AI drafting and indexing jobs. It does not yet implement the three specialist agents above. Their responsibilities, contracts and completion checks are defined in [the multi-agent plan](docs/agents_and_workflows.md).

## Editable content and scope

CreatorAi preserves editable production data instead of retaining only a flattened MP4. The current export package contains:

- `video.mp4` — the rendered output.
- `edit-plan.json` — source identity, cut instructions and output preset.
- `captions.srt` — timed subtitle text.
- `caption.txt` — supporting post copy.
- `cover.svg` — a cover with separate text layers.

These files support external editing and inspection. The package is not currently a native Premiere, Resolve or CapCut project.

An embedded video/image editor is outside the current product scope. The focus is agent-assisted production, candidate review, revision requests and export. Direct publishing, scheduling and Creator Intelligence are later milestones.

## Technology

| Layer | Stack |
| --- | --- |
| Web application | Next.js 16, React 19, TypeScript, custom CSS design system |
| Application API | Python 3.12, FastAPI, Pydantic |
| Data and identity | Supabase Postgres, Auth and private Storage; SQLAlchemy and Alembic |
| AI reasoning | Gemini Flash through a server-only Interactions API adapter |
| Agent orchestration | LangGraph with persistent checkpoints |
| Background execution | Database-backed queue with worker leases and recovery |
| Media processing | FFmpeg and FFprobe |
| Deployment configuration | Vercel frontend and Render Docker API |

Most development checks use mocked AI and real media processing. The prototype reuses analysis, bounds tool/inspection work and stops on provider failures without automatic model retries or paid fallbacks. Approval and rendering require no AI calls.

## Current prototype status

The end-to-end local demo has been verified against Supabase: footage import, audio/visual analysis, script generation, agent-selected clips, creator approval and real MP4/ZIP exports. Authentication, private media access and cross-account isolation have been checked. Local verification includes 29 passing backend tests, frontend lint/type checks and a production build.

Current source limits are **40 MB and 180 seconds**. Transcript timestamps are estimates and need review. Public Vercel/Render deployment and the Docker image still require host-side verification. See [implementation progress](docs/implementation_progress.md) for the precise checks and limitations.

## Run locally

Install **Node.js 24**, **pnpm 11.19.0**, **Python 3.12**, **uv**, and **FFmpeg/ffprobe**.

From the repository root, on first setup:

```powershell
pnpm install --frozen-lockfile
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item services/api/.env.example services/api/.env
```

Configure the copied env files before starting. The templates support an independent local profile; Supabase cloud setup is documented in [account setup](docs/human_setup.md). For AI features, put `GEMINI_API_KEY` in the API env and enable its demo worker. Keep database credentials and service keys server-only.

Start the API:

```powershell
cd services/api
uv sync --frozen --python 3.12 --cache-dir ../../.local/uv-cache
uv run --no-sync --cache-dir ../../.local/uv-cache uvicorn creatorai.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

In a second terminal at the repository root:

```powershell
pnpm dev
```

Open **http://127.0.0.1:3000/**. Both services must run. Do not expose anonymous local mode publicly.

## Project documentation

- [Collaborator setup](docs/collaborator_setup.md): another-PC setup, private env handoff and shared-worker configuration.
- [Product requirements](docs/product_requirements.md): current scope and acceptance criteria.
- [Multi-agent workflow](docs/agents_and_workflows.md): agent roles, handoffs and next implementation steps.
- [Technical stack](docs/technical_stack.md): installed technologies and service boundaries.
- [Core demo](docs/core_demo.md): how the existing runtime works.
- [Deployment setup](docs/human_setup.md): Supabase, Render and Vercel configuration.
- [Design system](DESIGN.md) and [design tools](docs/design_tools.md): interface direction and portable licensed resources.

The active application lives in `apps/web` and `services/api`. The original application is preserved in `archive/`; it is excluded from the active build. Secrets, local footage, generated exports and installed dependencies are excluded from Git. Third-party design resources retain their [licenses and provenance](THIRD_PARTY_NOTICES.md).
