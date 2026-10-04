# Account setup for the hosted prototype

Confirmed: this preview is personal/noncommercial, so Vercel Hobby is suitable under its current terms. No paid agents, workers, or inference accounts are required for this increment.

## Core demo AI setup

Create a free Gemini key in [Google AI Studio](https://aistudio.google.com/apikey), leave billing disabled, and set `GEMINI_API_KEY` in `services/api/.env`. Keep it server-only. `GEMINI_MODEL` selects the Flash model; the integration uses the current Interactions API. Set `ENABLE_DEMO_WORKER=true` for the single-process demo and restart the API after env changes. No LangSmith, Redis or paid worker account is required.

The private `creatorai-media` bucket must accept `application/zip` for editable export packages, as well as the existing video/JPEG MIME types. See [core demo](core_demo.md) for the full workflow, quota controls, worker separation and timing limitations. Public deployment remains deferred at the founder's request.

## 1. Supabase Free

Create a project in Mumbai or a nearby region. Keep the database password in your password manager. Do not paste secrets into chat.

Create a **private** Storage bucket named `creatorai-media`, with a 40 MB file-size limit. Leave it private; the API will issue short-lived links after checking project ownership. Direct browser storage writes are not used in this increment.

In Auth settings, enable Email/password sign-in. Keep email confirmation enabled. Add the local/frontend URLs to the allowed redirect list. New projects should use an asymmetric JWT signing key (ES256 or RS256) so the API can verify tokens with the public JWKS endpoint. The current implementation intentionally rejects legacy HS256 tokens.

Click **Connect → Connection string → Session pooler**, port **5432** (not the transaction pooler on 6543). Copy the complete PostgreSQL URL into `services/api/.env` as `DATABASE_URL`. Its `[YOUR-PASSWORD]` placeholder can remain: paste the actual, unencoded password into the separate `DATABASE_PASSWORD` field. The API selects the psycopg driver, safely inserts the password and requires SSL. The session pooler works over IPv4; we use normal SQLAlchemy sessions.

Fill `services/api/.env` from its example:

```dotenv
APP_MODE=cloud
DATABASE_URL=postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@YOUR_SESSION_POOLER:5432/postgres
DATABASE_PASSWORD="YOUR_RAW_DATABASE_PASSWORD"
STORAGE_BACKEND=supabase
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
STORAGE_BUCKET=creatorai-media
MEDIA_SIGNING_SECRET=GENERATE_A_RANDOM_SECRET
```

Retain local CORS origins/hosts while testing locally. The backend owns a separate `creatorai` database schema; do not manually create application tables. The migration command will create/version them.

Fill `apps/web/.env.local` from its example:

```dotenv
NEXT_PUBLIC_APP_MODE=cloud
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

You can tell me the project URL and when these files are ready. I can validate configuration without printing the values. Never put the database password/service role key in a `NEXT_PUBLIC_` variable or commit it.

## 2. Render Free API

Connect this repository, then use the checked-in `render.yaml` Blueprint. It builds the API Dockerfile with FFmpeg installed. Environment values marked `sync: false` are entered in Render's dashboard. Keep the API in cloud mode. Set `ALLOWED_HOSTS` to its exact `YOUR_SERVICE.onrender.com` hostname and local hosts; set `CORS_ORIGINS` to the exact frontend URL and any intentional local development origins.

The container runs versioned migrations before serving. SQLite and local media are rejected in the hosted profile because Render's free disk is ephemeral. Originals/thumbnails stay in the private Supabase bucket. Render free services sleep when idle; the interface must handle the cold start. No periodic keep-alive workaround.

## 3. Vercel Hobby frontend

Import the repository. Set **Root Directory** to `apps/web` and enable access to files outside that directory so pnpm can read the root lock/workspace files. Use the Next.js preset and Node.js 24.

Set the four `NEXT_PUBLIC_` values above, with `NEXT_PUBLIC_API_URL=https://YOUR_API.onrender.com`. The build intentionally rejects Vercel deployments in local mode. Add the final Vercel URL to the API CORS list and Supabase Auth redirect settings, then redeploy if a build-time public value changed.

First deploy the API with the planned frontend origin configured, then the frontend. Check `/health`, sign in, create a project, import a small real MP4, reload it, and verify a second account cannot access its project/media.

## Status

The supplied local env files are now configured for Supabase cloud mode. Postgres migrations, real Auth tokens, private Storage and account isolation have been checked from the local application. The database password is a separate raw value; no secret values are printed. Render/Vercel public deployment remains pending and needs the acceptance checks above on the deployed URLs. Docker is not installed here, so the container has not been built locally.

Primary references: [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [JWT verification](https://supabase.com/docs/guides/auth/jwts), [private Storage access](https://supabase.com/docs/guides/storage/security/access-control), [Render free limitations](https://render.com/docs/free), and [Vercel monorepos](https://vercel.com/docs/monorepos).
