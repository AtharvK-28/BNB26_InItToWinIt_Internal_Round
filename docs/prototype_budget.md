# Free-first prototype constraints

Updated: 4 October 2026. Supabase and Gemini are configured and the local demo works. Public deployment remains deferred. The current direction is a multi-agent workflow without an inbuilt editor.

## Retain the inexpensive base

Use the current Next.js/FastAPI application, Supabase Auth/Postgres/private Storage, Gemini adapter, LangGraph library, Postgres-backed job queue and FFmpeg. No paid agent platform, Redis/Celery broker, dedicated GPU or editor SDK is required for the next increment. Local mode remains available through SQLite/local files.

The proposed Story, Research and Director agents share infrastructure and a whole-run budget. Splitting responsibilities must not multiply the old request/inspection limits. Reuse source analysis, pass compact evidence, skip unchanged stages and stop on quota failures without automatic retries or paid fallback. Use mocked providers for most development checks.

One designated worker handles a shared Supabase demo. Free sleeping hosting pauses progress; durable jobs/checkpoints remain stored. A separate always-on worker is a later operational decision, not a prerequisite for local development.

## Current limits and delivery order

- Source footage: up to 40 MB / 180 seconds; bounded CPU extraction/rendering.
- Keep current bounded requests, tool calls, visual inspections and spacing while introducing shared agent accounting.
- Next: typed handoffs, specialist subgraphs, missing-evidence feedback, review/export UX and tests.
- Then: verify Vercel/Render deployment and collect representative quality feedback.
- Later: alignment/tracking, publication and intelligence when justified by real need.

Do not expand editor scope or provision paid services to make the agent architecture look more sophisticated. Free-tier quotas, availability and terms must be rechecked before public deployment. See human_setup.md for service configuration and collaborator_setup.md for another PC.
