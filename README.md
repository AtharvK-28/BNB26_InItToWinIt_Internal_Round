# CreatorAi

### AI-powered content operations for creators

CreatorAi brings a creator's ideas, scripts and footage into one workspace and helps turn them into useful, platform-ready content. It connects what the creator wants to say with what actually exists in their footage, proposes short clips with supporting evidence, and keeps the creator in control through review, editing and revision.

Around that production core sits a creator studio: a daily brief, a content calendar, idea/script/repurposing tools, insights and an in-app copilot, plus optional business tools (brand deals, inbox, earnings).

## The problem

Content production is scattered across writing tools, asset folders, editing applications and publishing platforms. Creators repeatedly search through recordings, rewrite hooks and prepare different versions of the same content.

CreatorAi connects those steps around a project: keep the source material together, understand it once, find the moments that support the story, edit them, and prepare outputs for the intended platforms.

## The creator workflow

Every video lives in a **Project** (`/studio/projects`) with four stages:

| Stage | What the creator does | What CreatorAi provides |
| --- | --- | --- |
| **Material** | Upload footage and organize it in a project | Private originals, thumbnails, metadata and reusable audio/visual analysis |
| **Story** | Add an idea, brief or existing script | Suggested hooks, a working script, titles and supporting copy for explicit acceptance |
| **Cuts** | Ask the clip agent for moments, or cut manually, then edit | Source-linked candidates with transcript quotes and visual evidence, an approve/revise gate, and an editor for trim, title, on-screen hook, framing, captions and cover |
| **Deliver** | Choose an output format and export | Rendered MP4s for YouTube Shorts, Instagram Reels or landscape YouTube, plus an editable package |

Creators can begin with a script or with existing footage. The rest of the studio connects to the same projects:

| Area | Route | What it does |
| --- | --- | --- |
| **Today** | `/studio` | Daily brief, projects to pick up, what's due, quick actions |
| **Create** | `/studio/create` | Idea generator, script outliner, repurposing, title lab, trend radar; a script can start a new project |
| **Calendar** | `/studio/calendar` | Plan posts per platform with a weekly workload check |
| **Insights** | `/studio/insights` | Production patterns computed live from projects (footage → export time, agent cuts edited, exports by format) alongside audience analytics |
| **Library** | `/studio/library` | Every source clip and export across projects |
| **Copilot** | "Ask CreatorAI" | Answers using the workspace, including project status and pending clip-agent reviews |
| **Business extras** | Menu → Deals, Packages, Earnings, Inbox, Automations; `/deals`, `/c/[handle]` | Brand marketplace, bookable packages, invoices, media kit and link-in-bio |

The production pipeline uses real data from `services/api`. The studio and business areas currently run on a sample creator workspace stored in the browser.

## What makes the workflow useful

- **Source-grounded proposals:** clips refer to actual footage ranges, speech and inspected visual windows. Missing evidence is surfaced rather than invented.
- **Reusable understanding:** a saved footage index avoids analyzing the same source for every request.
- **Creator control:** AI results are staged for review; accepting a suggestion is explicit, every edit is saved as a new revision, and newer creator work is not silently overwritten (409 on stale revisions).
- **Recoverable work:** jobs and agent checkpoints persist so an interrupted workflow can resume.
- **Platform adaptation:** exports support YouTube Shorts, Instagram Reels and a landscape YouTube preset, with framing, captions and the opening hook burned in.
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

CreatorAi preserves editable production data instead of retaining only a flattened MP4. The export package contains:

- `video.mp4` — the rendered output.
- `edit-plan.json` — source identity, cut instructions and output preset.
- `captions.srt` — timed subtitle text.
- `hook.srt` — the on-screen opening hook (first 3 seconds), when the cut has one.
- `caption.txt` — supporting post copy.
- `cover.svg` — a cover with separate text layers.

These files support external editing and inspection. The package is not a native Premiere, Resolve or CapCut project. The in-app cut editor covers the edits the pipeline can render (trim, title, hook, framing, captions, cover); a full timeline editor is out of scope.

## Technology

| Layer | Stack |
| --- | --- |
| Web application | Next.js 16, React 19, TypeScript, Tailwind CSS v4, zustand, Lucide |
| Studio text AI | Claude (`claude-opus-5-5`) through server-only Next.js route handlers when `ANTHROPIC_API_KEY` is set; a built-in local engine otherwise |
| Application API | Python 3.12, FastAPI, Pydantic |
| Data and identity | Supabase Postgres, Auth and private Storage; SQLAlchemy and Alembic (SQLite + local files in local mode) |
| Video AI | Gemini Flash through a server-only Interactions API adapter |
| Agent orchestration | LangGraph with persistent checkpoints |
| Background execution | Database-backed queue with worker leases and recovery |
| Media processing | FFmpeg and FFprobe |
| Deployment configuration | Vercel frontend and Render Docker API |

The two AI providers have separate jobs: Gemini (in the API) understands footage and runs the clip agent; Claude (in the web app) drafts studio text. Neither is required to cut, edit and export manually.

## Current status

Verified locally against the API in local mode: project creation, footage upload, manual cuts, editing with revision saves, cover editing, MP4/ZIP export with burned-in captions and hook, Deliver, Library, Today and Insights. The backend suite (29 tests, Postgres test in CI) and frontend lint, typecheck and production build pass.

Earlier verification against Supabase covered footage analysis, script generation, agent-selected clips, creator approval, authentication, private media access and cross-account isolation. Current source limits are **40 MB and 180 seconds** (MP4, WebM, H.264 MOV). Transcript timestamps are estimates and need review. See [implementation progress](docs/implementation_progress.md) for details.

## Run locally

Install **Node.js 24**, **pnpm 11.19.0**, **Python 3.12**, **uv**, and **FFmpeg/ffprobe**.

From the repository root, on first setup:

```powershell
pnpm install --frozen-lockfile
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item services/api/.env.example services/api/.env
```

Configure the copied env files before starting. The templates support an independent local profile; Supabase cloud setup is documented in [account setup](docs/human_setup.md). For the clip agent and story drafting, put `GEMINI_API_KEY` in the API env and enable its demo worker. `ANTHROPIC_API_KEY` in `apps/web/.env.local` is optional. Keep database credentials and service keys server-only.

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

Open **http://127.0.0.1:3000/** (it opens the studio). Projects, Library and production insights need the API running; the rest of the studio works without it. Do not expose anonymous local mode publicly.

## Project documentation

- [Collaborator setup](docs/collaborator_setup.md): another-PC setup, private env handoff and shared-worker configuration.
- [Product requirements](docs/product_requirements.md): current scope and acceptance criteria.
- [Multi-agent workflow](docs/agents_and_workflows.md): agent roles, handoffs and next implementation steps.
- [Technical stack](docs/technical_stack.md): installed technologies and service boundaries.
- [Core demo](docs/core_demo.md): how the existing runtime works.
- [Deployment setup](docs/human_setup.md): Supabase, Render and Vercel configuration.
- [Design system](DESIGN.md): interface rules for the web app.

The application lives in `apps/web` and `services/api`. Secrets, local footage, generated exports and installed dependencies are excluded from Git. Third-party design resources retain their [licenses and provenance](THIRD_PARTY_NOTICES.md).
