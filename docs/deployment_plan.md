# Deployment plan for the free-first demo

Updated: 4 October 2026. Local frontend/API connect to configured Supabase. Public release is pending at the founder's request; Docker has not been built on this PC. Multi-agent upgrade is proposed and does not require more services.

## Actual repository and target hosts

- apps/web: Next.js frontend; Vercel configuration and cloud-mode guards.
- services/api: FastAPI, current LangGraph clip agent, queue/worker, media processing, migrations and tests.
- render.yaml: Render Docker API blueprint, including FFmpeg and a single enabled demo worker.
- Supabase: Auth, Postgres product state/private agent checkpoints and private originals/exports.
- docs/design-resources and archive: licensed references and original app; not application dependencies.

The target multi-agent coordinator and specialist subgraphs run inside the same Python worker. Agent roles are not separate hosted servers. Celery, Valkey and Modal from the earlier topology are future alternatives, not current deployment requirements.

## Configuration and release

Use human_setup.md for exact Supabase/Render/Vercel env placement and collaborator_setup.md for local setup. Never commit server secrets. Set exact allowed API hosts/CORS origins, cloud mode, private Storage and the approved frontend URL in Auth redirect settings.

Use Supabase's session pooler and SSL as configured. Alembic owns product-schema migrations; checkpoint setup owns the private LangGraph schema. Current migrations reach 0003. Coordinate future migrations for typed multi-agent handoffs rather than independently editing shared schemas.

Run one designated worker for the shared free-tier demo. The API-hosted worker pauses while Render sleeps; a process split is supported by python -m creatorai.worker with the API's ENABLE_DEMO_WORKER=false. A free service is not an always-on production worker.

## Release acceptance

Build the Docker image, deploy the API and frontend, then check health, real sign-in, upload, source playback, AI run/review/resume, MP4/ZIP downloads and cross-account 404s on public URLs. Check cold-start/quota/reconnect behavior and ownership boundaries. GitHub CI exists; a local successful build does not prove a hosted release.

The creator interface requires candidate review, revision requests and export. Embedded video/image editors are not deployment acceptance requirements. Publication/scheduling and Creator Intelligence are later integrations.
