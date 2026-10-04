# CreatorAi

A free-first creator workspace with AI scripts/hooks, cached audio/visual understanding, a tool-using clip agent, editable cuts/captions/covers and real platform video exports. Supabase provides Auth, Postgres and private Storage. The previous application is preserved under `archive/`.

## Run locally

Requirements: Node.js 24, pnpm 11.19.0, Python 3.12, uv, and FFmpeg/ffprobe for clip import. JavaScript versions are locked in `pnpm-lock.yaml`; Python versions are locked in `services/api/uv.lock` and exported to `requirements.txt`.

First install dependencies:

```powershell
pnpm install --frozen-lockfile
cd services/api
uv sync --frozen --python 3.12 --cache-dir ../../.local/uv-cache
```

Copy `services/api/.env.example` to `.env` and `apps/web/.env.example` to `.env.local` **only on first setup**. Follow [account setup](docs/human_setup.md) for the cloud profile. Frontend env values are public; database credentials and the service role key belong only in the API env. Env files are ignored.

For another PC or a shared Supabase project, follow [collaborator setup](docs/collaborator_setup.md), including portable FFmpeg paths and the single shared-worker setting.

Start the API from `services/api`:

```powershell
uv run --no-sync --cache-dir ../../.local/uv-cache uvicorn creatorai.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

In a separate terminal at the repository root:

```powershell
pnpm dev
```

Open [the workspace](http://127.0.0.1:3000/). The browser calls the API directly using its configured URL. Both services must run. API startup applies versioned migrations before accepting requests.

The default example files also support an offline, single-user loopback profile: keep both modes `local`, leave `DATABASE_URL` empty, and keep `STORAGE_BACKEND=local`. It uses `.local/creatorai.db` and `.local/media`. Existing SQLite drafts are backed up before the first migration; switching to cloud does not automatically transfer local drafts. Never expose anonymous local mode publicly.

## Current workflow

Create a project, write an editable brief, and choose YouTube/Instagram destinations. Save explicitly or with Ctrl/Cmd+S. Unsaved working text is recovered from owner-scoped session storage within the same browser tab; stale revisions are rejected and drafts can be downloaded before reloading.

Open **Material** to add an MP4, WebM or H.264 MOV, up to 40 MB, 180 seconds and 4K. Imports retain the original, extract metadata and generate a real thumbnail. Duplicate bytes within a project reuse the existing asset. Upload progress, stop/reconcile, storage errors and expired preview links have recovery controls. Browser playback still depends on the file's codecs/container; H.264 MP4 is the most reliable supported input.

Open **Story** for AI hooks and a script, **Cuts** for cached footage analysis and agent-selected moments, and **Deliver** for actual MP4/ZIP exports. All cuts remain editable, including timing, crop, captions and layered cover text. Review approval is explicit. See [core demo](docs/core_demo.md) for quotas, durable execution and the remaining limitations. Publishing to platform accounts and Creator Intelligence remain deferred.

Cloud projects, runs, analyses, cuts and exports are restricted by authenticated owner. Storage stays private; preview/download links expire after five minutes. Add a server-only `GEMINI_API_KEY` and set `ENABLE_DEMO_WORKER=true` in the API env to enable queued AI/render work. Manual cuts and exports do not consume AI quota.

## Deployment

`render.yaml` prepares a Free Render Docker API, including FFmpeg. Import `apps/web` into Vercel Hobby for this personal/noncommercial demo. Set the dashboard env values described in [account setup](docs/human_setup.md). The hosted profile rejects SQLite/local storage, and Vercel builds reject missing cloud settings. Containers and public deployment still require checks on the actual hosts; local Supabase verification alone is not a public deployment.

## Checks

```powershell
pnpm lint
pnpm build
pnpm typecheck
cd services/api
uv run --no-sync --cache-dir ../../.local/uv-cache ruff check creatorai migrations tests
uv run --no-sync --cache-dir ../../.local/uv-cache pytest -q
```

CI includes FFmpeg media tests and a disposable Postgres service. See [implementation progress](docs/implementation_progress.md) for the checks actually run.

## Design tools on another PC

The three selected skill snapshots are checked in with their licenses. No design service or account is needed:

```powershell
python docs/tools/setup_design_skills.py
python docs/tools/setup_design_skills.py --install
```

This verifies the snapshot, then optionally installs project-local skill copies without overwriting existing ones. Restart the coding agent or refer directly to the SKILL.md paths in [design tools](docs/design_tools.md). Generated copies are ignored. Keep [third-party notices](THIRD_PARTY_NOTICES.md) with redistributed resources.

Start with [the docs index](docs/README.md), [free prototype plan](docs/prototype_budget.md), and root [DESIGN.md](DESIGN.md). The archive stays outside active builds and lint.
