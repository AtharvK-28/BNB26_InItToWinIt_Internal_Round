<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CreatorAi project context

Read `DESIGN.md` and `docs/implementation_progress.md` before continuing implementation. This is an iterative, free-first prototype. Keep each increment functional and verified; avoid invented AI outputs or performance metrics.

Current scope: develop coordinator/Story/Footage Research/Clip Director workflows with typed handoffs and shared budgets. Read `docs/product_requirements.md` and `docs/agents_and_workflows.md` before agent or workflow changes. Current runtime has one adaptive clip agent, not an implemented multi-agent system. Inbuilt video/image editors are out of scope; retain portable structured output files and prioritize candidate review, agent revision requests and export. Existing experimental editing controls are not permission to expand editor scope.

For UI work, read the portable skill files under `docs/design-resources/open-design/skills/frontend-design/`, `docs/design-resources/hallmark/skills/hallmark/`, and `docs/design-resources/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/`. Product tokens and the working application brief in DESIGN.md take precedence over marketing-page defaults. Read only relevant references. The optional offline setup command is `python docs/tools/setup_design_skills.py --install`.

Never display `.env` values, signed URLs, bearer tokens, or passwords. Archive content stays outside the active build. Cloud deployments require Supabase Auth/Postgres/private Storage; local anonymous mode is only for loopback development.
