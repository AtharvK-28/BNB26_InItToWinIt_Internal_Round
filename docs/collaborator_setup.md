# Run CreatorAi on another PC

The repository includes the application, archive, database migrations, dependency lockfiles, deployment configuration, and licensed design resource snapshots. Secrets, downloaded tools, uploaded footage, generated exports, local databases and generated skill installations are intentionally excluded.

## Install and run

Install Node.js 24, pnpm 11.19.0, Python 3.12, uv, and FFmpeg (including ffprobe). On Windows, FFmpeg can be installed with `winget install --id Gyan.FFmpeg --exact`; reopen the terminal and check `ffmpeg -version` and `ffprobe -version`.

From the cloned repository root:

```powershell
pnpm install --frozen-lockfile
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item services/api/.env.example services/api/.env
cd services/api
uv sync --frozen --python 3.12 --cache-dir ../../.local/uv-cache
uv run --no-sync --cache-dir ../../.local/uv-cache uvicorn creatorai.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Copy env templates only on first setup, before editing them. In a second terminal at the repository root, run `pnpm dev` and open http://127.0.0.1:3000/. Configure env values before starting; restart the API after changing its env file.

## Option A: independent local development

The example files default to local mode. No Supabase credentials are required. Keep `APP_MODE=local`, `NEXT_PUBLIC_APP_MODE=local`, an empty `DATABASE_URL`, and `STORAGE_BACKEND=local`. Projects/media live in that PC's ignored `.local` folder. This is anonymous loopback development and must not be exposed publicly.

For AI features, set a personal free `GEMINI_API_KEY` in `services/api/.env` and keep `ENABLE_DEMO_WORKER=true`. Without a key, manual cuts, editing and video export still work. Each collaborator can upload their own short MP4 instead of copying the founder's local state.

## Option B: use the shared Supabase prototype

Share these values privately with trusted backend developers, or let them configure their own Supabase project using [human_setup.md](human_setup.md):

| File on their PC | Values required |
| --- | --- |
| `apps/web/.env.local` | `NEXT_PUBLIC_APP_MODE=cloud`, local `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `services/api/.env` | `APP_MODE=cloud`, `STORAGE_BACKEND=supabase`, `DATABASE_URL`, `DATABASE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_BUCKET`, `MEDIA_SIGNING_SECRET`, `GEMINI_API_KEY`, model/worker settings |

The frontend values are publishable. Database credentials, service-role key, signing secret and Gemini key are privileged server credentials: use a password manager/private secret channel, never GitHub or public chat. A developer connecting only to an existing hosted API does not need the backend secrets.

Use `FFMPEG_BINARY=ffmpeg` and `FFPROBE_BINARY=ffprobe` when the tools are on PATH. Do not copy the founder's absolute Windows tool paths. Keep the local hosts/CORS defaults for loopback use. The private bucket must accept video/JPEG and `application/zip`.

Create a separate CreatorAi account through the app for each collaborator; ownership means their projects are separate. Run one worker against the shared Supabase queue: keep `ENABLE_DEMO_WORKER=true` on the designated API process and false on additional API processes. Otherwise multiple workers can consume the shared Gemini quota concurrently. Queued jobs on the shared database are processed by the designated worker and use its AI key.

API startup applies database migrations. Coordinate schema changes with the team when using the same Supabase database.

## Optional files to share separately

- A small sample MP4, if everyone should test the same footage. Current limit: 40 MB / 180 seconds. The founder's `.local/deno-input.mp4` is not committed.
- `.local/demo-reel.mp4` and `.local/demo-editable.zip`, if collaborators want to inspect the verified output immediately.

Do not share `.venv`, `node_modules`, browser session data, temporary verification credentials or the entire `.local` directory. Dependencies and databases are recreated through the setup commands.

## Design skills

The pinned design resources and licenses are already in Git. No separate download or account is required:

```powershell
python docs/tools/setup_design_skills.py
python docs/tools/setup_design_skills.py --install
```

The first command verifies resources; the second optionally creates ignored project-local skill copies. Restart the coding agent after installation. See [design_tools.md](design_tools.md) for invocation and precedence.
