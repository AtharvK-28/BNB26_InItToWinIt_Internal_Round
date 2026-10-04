<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CreatorAi project context

Read `README.md`, `DESIGN.md` and `docs/implementation_progress.md` before continuing implementation. This is an iterative, free-first prototype. Keep each increment functional and verified; avoid invented AI outputs or performance metrics.

The product is one web app (`apps/web`) with the video pipeline API (`services/api`) behind it. The studio shell, navigation and Airbnb-style design system in `apps/web` are the agreed UI: build new screens inside them (`components/studio/Shell`, `components/ui`, tokens in `globals.css`) rather than introducing a separate stylesheet, theme or app shell. Pipeline screens live under `/studio/projects` and `components/video`; the API client is `lib/video`.

Current scope: develop coordinator/Story/Footage Research/Clip Director workflows with typed handoffs and shared budgets. Read `docs/product_requirements.md` and `docs/agents_and_workflows.md` before agent or workflow changes. Current runtime has one adaptive clip agent, not an implemented multi-agent system. The cut editor covers only what the renderer applies (trim, title, hook, framing, captions, cover); a timeline editor is out of scope. Keep editor previews and `services/api/creatorai/render.py` in sync, and retain portable structured output files.

Studio text AI (ideas, scripts, repurposing, copilot) runs in `apps/web/src/app/api/ai` with Claude when `ANTHROPIC_API_KEY` is set and a local engine otherwise. Footage understanding and the clip agent run in the API with Gemini. Don't spend a provider's quota in tests; use the mocks.

Never display `.env` values, signed URLs, bearer tokens, or passwords. Cloud deployments require Supabase Auth/Postgres/private Storage; local anonymous mode is only for loopback development.
