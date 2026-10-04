# Deployment plan and build handoff

**Prototype override, 4 October 2026:** the founder now requires mostly free operation. [prototype_budget.md](prototype_budget.md) takes precedence over paid-service requirements below. The current build runs locally with SQLite and no external accounts. This document's cloud topology is a future deployment path; do not deploy local SQLite to an ephemeral free service. Authentication, Postgres persistence, and tenant isolation precede a public demo.

Baseline: 4 October 2026. Architecture selected; no accounts/resources created, secrets supplied, dependencies installed, or deployment performed in this turn.

## Target services

| Service | Host | Runtime / scaling boundary |
| --- | --- | --- |
| creatorai-web | Vercel | Next.js; browser editors, auth UI and short SSR work |
| creatorai-api | Render web service | Docker/Python FastAPI; API and authorized SSE |
| creatorai-agent-worker | Render background worker | Celery agent queue; LangGraph segments; one supervised maintenance scheduler |
| creatorai-media-worker | Render background worker | Celery media queue; FFmpeg/PySceneDetect; bounded CPU and scratch space |
| creatorai-broker | Render Key Value | Paid persistent Valkey; same region as workers/API, noeviction queue policy |
| creatorai-data | Supabase | Postgres/pgvector, Auth and private Storage buckets |
| creatorai-inference | Modal | GPU functions for speech/embeddings/alignment, versioned model cache |

API and worker services use the same backend image with different entry points. GPU inference uses a separate environment/image so CUDA/model dependencies do not enlarge ordinary backend deploys. Separate agent/media workers prevent a long render from delaying interactive story work.

Render's [worker documentation](https://render.com/docs/background-workers) describes continuously running queue consumers. Its [Key Value docs](https://render.com/docs/key-value) document the Redis-compatible backend and paid persistence. Free-tier sleeping or ephemeral services are not the selected reliable deployment baseline. We have not quoted a price or provisioned a plan.

## Planned repository structure

```text
apps/
  web/                       # Next.js application
services/
  backend/                   # Python API, agents, job dispatch and CPU media modules
    src/creatorai/
      api/
      domain/
      agents/
      jobs/
      media/
      integrations/
    migrations/
    tests/
    Dockerfile
    pyproject.toml
    uv.lock
  inference/                 # Modal definitions, ML implementation and model manifests
    pyproject.toml
    uv.lock
packages/
  contracts/                 # Generated API types and versioned document schemas
infra/
  compose.yaml               # Local API/workers/Valkey plus local Supabase integration
  render.yaml                # API, workers, broker blueprint
docs/
.github/workflows/
pnpm-workspace.yaml
pnpm-lock.yaml
```

This is a plan; folders above are not created yet. Generated contracts should be checked for drift in CI. Do not add Turborepo until build size warrants it. The web app and Python package use separate lockfiles; deployment pins Node 24 and Python 3.12 plus tested package/image versions.

## Local environment

Use Docker Desktop Linux containers/WSL2 on Windows for API, workers, and Valkey, plus the Supabase CLI's local stack where available. Run the Next app directly for fast iteration. GPU work can use the authenticated remote Modal development adapter; a CPU adapter with a smaller speech model supports limited local debugging without pretending to meet production performance.

Never make successful frontend development depend on GPU availability. A fixture/dev adapter may supply explicitly labeled sample analysis and must be disabled in production. Model and ffmpeg downloads should happen in images or versioned caches, not per creator request.

## Configuration contract

Browser-safe configuration:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_API_URL

API/worker configuration, server only:

- DATABASE_URL, checkpoint connection configuration, broker URL, explicit allowed origins
- Supabase URL plus restricted server storage credentials as needed; JWT issuer/audience/JWKS configuration
- GOOGLE_API_KEY; TEXT_VISION_MODEL=gemini-3.8-flash; optional IMAGE_MODEL=gemini-3.1-flash-image
- Modal application/environment credentials and authenticated completion-callback configuration
- Encryption key for saved platform OAuth credentials when publishing is implemented
- Sentry DSN, environment/release identifiers, resource/time/upload limits

Use per-environment secret stores and .env.example placeholders during bootstrap. Public Next variables must never contain service keys, broker/DB URLs, encryption keys, or model provider secrets. Production should fail fast on missing required settings; it must not silently fall back to demo fixtures.

## Database and connection strategy

Alembic owns application schema migrations, including extension setup, constraints, private schema boundaries, indexes and required policies. Supabase owns auth/storage service schemas; do not recreate them. LangGraph checkpoint tables get their own controlled setup/migration lifecycle, tested against the selected Postgres checkpointer version.

Run migrations once as a deployment step, not independently in every API/worker replica. Use a dedicated migration role. API/worker pools must fit the database connection budget. Prefer a direct connection or session pooler for long-lived services/checkpointer behavior. Verify network IPv4/IPv6 reachability and avoid selecting transaction pooling without checking prepared statements/session semantics. See [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).

Production region selection should minimize API/database/queue distance. Keep Render services and broker together; choose nearby available Supabase and Modal regions, then measure actual latency. Do not promise an exact common region until account/provider availability is checked.

## Storage and media lifecycle

Private buckets cover originals, derivatives and outputs. Originals are durable; worker files are job-scoped scratch data and are removed in a finally/cleanup path. Render has an [ephemeral filesystem by default](https://render.com/docs/deploys); no original or required project file may exist only on a container disk.

Use [direct resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads), with retries and token refresh. Validate actual objects before queuing analysis. Set measured upload duration/size caps during bootstrap to protect worker memory/disk; enforce the same caps in UI, API and job validation.

Do not send video through a Next route. Vercel functions have [request/duration limits](https://vercel.com/docs/functions/limitations), which is why media transfer/processing are separate. Browsers play/download via signed Storage access; API responses contain metadata and URLs.

Version derivatives by content hash and pipeline/model settings. Reuse compatible analysis. Set retention rules for abandoned uploads, superseded previews, and exports while retaining originals and saved drafts per the product policy. Track storage bytes and processing cost.

## Async GPU completion

Media worker submits a Modal job and stores its call ID and attempt-specific completion token. Callback data contains job ID, artifact references and completion status, not arbitrary executable data. Verify the receipt/token and current job ownership before applying results. Duplicate receipts are safe.

Validate artifacts and persist completion before enqueuing downstream work through the outbox. A periodic reconciler checks pending calls and lost callbacks using the [Modal job pattern](https://modal.com/docs/guide/job-queue). Bound remote run time/concurrency; avoid repeatedly submitting the same job after a client timeout.

Cache model weights in Modal image/Volumes and cap containers per model workload. Warming reduces cold-start risk at an idle-compute cost; [Modal cold-start guidance](https://modal.com/docs/guide/cold-start) explains the tradeoff. Start with scale-to-zero and measure; do not advertise warm latency as the first-upload experience.

## Delivery sequence

CI runs independent web and Python jobs: frozen-lockfile installation, lint/type checks, meaningful document-operation tests, and production builds. Generate/check OpenAPI contract drift. Backend checks include migrations against a disposable Postgres/Valkey environment and representative job restart/idempotency tests. Build the CPU image separately from the GPU environment. Playwright covers the authenticated upload-to-editable-export path in staging once that path exists.

Deploy a known commit/image after checks pass. Apply backward-compatible migrations first, then roll API/workers and web. Drain or checkpoint active jobs on shutdown; ensure older and newer worker versions agree on the queued task/document schemas. Reverting an application image should not require deleting creator data. Treat destructive schema changes as separate migrations with a recovery plan.

Do not share API async connection pools across Celery prefork children or across newly created task event loops. Initialize connections in their owning process/loop and close them correctly. LangGraph and application pools together must respect the database connection budget.

1. Bootstrap a clean workspace, lock dependency versions, install Next and read the bundled guides before app code.
2. Add local services, health/readiness endpoints, validated config, migrations, and a first CI pipeline.
3. Add real auth and an owned project/asset record. Deploy a minimal web/API/data path to staging early.
4. Verify resumable direct upload, authorized playback and tenant isolation against staging Storage.
5. Deploy media/agent workers plus Valkey; verify durable job events, retries, cancellations and restart recovery with small real media.
6. Deploy Modal functions; prove one cached transcription/embedding job and authenticated completion.
7. Add evidence indexing, a bounded tool-using agent, editable clip saving, and FFmpeg export.
8. Add the selected product UI and YouTube/Instagram variants as each capability becomes real.

The UI skeleton is developed alongside steps 3–7; auth/upload/deployment checks should not become an excuse to postpone the simple creator journey. Working increments use real services or visibly labeled fixtures, never fabricated success states.

## Deployment acceptance

- Browser login, project creation, real upload, processing events, editable clip and export work over production-style URLs.
- Asset URLs, API reads and search cannot expose a different user's project.
- Refresh/reconnect resumes progress and a worker restart reuses completed extraction.
- A graph review pause resumes the same run; duplicate job/callback deliveries do not duplicate revisions or artifacts.
- A saved timeline can reopen, undo an AI change, and render with verified timing/caption/crop behavior.
- Logs/errors identify project/run/job/stage without exposing secrets or unrestricted media URLs.
- App/worker shutdown, orphan recovery, connection pools and scratch-space limits behave under realistic files.
- Private assets and editable documents survive redeployment; a backup/recovery procedure exists before general use.

Checks will be implemented where they validate these material boundaries; do not add tests that simply restate styling or implementation.

## Cost and access boundaries

The baseline includes continuously running API and worker services, a persistent broker, managed database/storage, model calls and GPU processing. Storage playback/download can add egress charges. Small-team suitability is a design assumption, not a zero-cost promise or a forecast.

Accounts and credentials needed at actual deployment: Vercel, Render, Supabase, Modal, Google AI, and optionally Sentry. OAuth publishing credentials come later. No cloud purchase, external deployment, destructive repository reset, or credential configuration was performed in this planning turn.
