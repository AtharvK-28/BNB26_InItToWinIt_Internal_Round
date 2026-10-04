# Implementation progress

Updated: 4 October 2026. Current increment: **the working core creator demo**.

Founder scope correction: the next increment is a multi-agent system with explicit specialist handoffs. The current code has one adaptive clip agent plus fixed story/indexing steps; it must not be presented as an implemented multi-agent system. Inbuilt video/image editors are excluded from current scope. The tested manual editing controls below are historical implementation extras, not required deliverables. See product_requirements.md and agents_and_workflows.md for the authoritative direction.

## Working product

The application now follows Material → Story → Cuts → Deliver. The original application remains under `archive/legacy-app-2026-10-04/` with its 113-file manifest; the active app is the new pnpm/Python workspace.

- **Material:** real private video imports, immutable originals, FFprobe metadata, FFmpeg thumbnails and per-project content-hash deduplication. Prototype limits are 40 MB, 180 seconds and up to 4K. Supported sources are MP4, WebM and H.264 MOV.
- **Story:** Gemini generates hooks, a script, titles and a post caption from the saved brief. Applying a suggestion is explicit; it never silently overwrites the creator's text.
- **Understanding:** one audio-and-sampled-frames pass produces a persisted timestamped transcript, visual observations and a summary. Later runs reuse this index, including after a drafting-model change. Timings are model estimates, not forced alignment.
- **Clip agent:** an actual LangGraph workflow reads the script, searches transcript evidence, inspects candidate video frames and proposes validated cuts. Tools have fixed permissions and budgets. Proposals must quote the source transcript and fit an inspected window. The workflow checkpoints in Postgres for the cloud profile and pauses for creator approval or feedback.
- **Experimental controls, outside current scope:** saved cut documents expose source trim times, title, hook, caption/crop and two cover text layers. These existing controls retain their tested behavior but are not an inbuilt-editor requirement. Structured output documents and external-editable packages remain in scope.
- **Delivery:** real FFmpeg MP4 exports for YouTube Shorts, Instagram Reels and a landscape YouTube preset. A private ZIP contains the rendered video, source-linked edit plan, SRT, post caption and layered SVG cover. The prototype editor is deliberately small; the ZIP is portable source material, not a Premiere/Resolve timeline.
- **Workflow:** durable database jobs, visible tool activity, stop/retry controls, expiring worker leases and restart recovery. A single worker can run with the API for the free demo, or separately through `python -m creatorai.worker`.

The frontend uses custom studio tokens and local variable fonts with OpenDesign, Hallmark and targeted UI UX Pro Max guidance. The next UI direction prioritizes source-grounded candidate review, approval and revision requests over the experimental editing surface.

## Persistence, security and deployment preparation

Next.js 16.3.8 / React 19.2.8 serves the frontend. FastAPI, SQLAlchemy, Alembic and Supabase Auth/Postgres/private Storage serve the backend. The configured cloud database is migrated through **0003**.

The API verifies signed Supabase JWT claims and enforces ownership on projects, assets, runs, analyses, cuts and exports. Unknown and other-account IDs return 404. The dedicated application and checkpoint schemas have no browser-role permissions; application tables use RLS as extra protection. API ownership checks remain the tenant boundary because the backend database role can bypass RLS. Private media links expire after five minutes.

Gemini keys remain server-only. The adapter uses Google's Interactions API with `store: false`, low reasoning and no exposed thought summaries. Calls are spaced, source indexes are reused, inspection and tool budgets are bounded, and provider/quota failures stop with a recoverable error. There are no automatic provider retries or invented fallback results. Saving, approval, manual cuts and FFmpeg exports consume no AI requests. See [core_demo.md](core_demo.md) for the exact limits.

Render Docker and Vercel configuration, Python requirements/lockfiles, version files and GitHub Actions checks are prepared. `.env` files, credentials, databases, FFmpeg copies, media outputs and generated skill installations are ignored. The 204 pinned design resource files can be committed with their licenses and commit provenance; the offline installer supports another PC.

## Verification completed

- **29 backend tests passed; one CI-only Postgres-service test skipped locally.** Tests include actual FFmpeg processing, LangGraph checkpoint/review recovery, editable renders, revision conflicts, request idempotency, cancellation, cache reuse, safe provider failures, Interactions serialization, opaque tool-call replay, no retries on quota errors, authentication and owner isolation.
- Ruff, ESLint, TypeScript and the production Next.js build passed after the final editor changes.
- Live Supabase verification used two disposable confirmed test accounts, with no confirmation emails. The actual provided 174.8-second footage was imported, analyzed, indexed and processed through the real agent. It proposed a **29.9-second cut at 94.0–123.9 seconds**, paused for review, and resumed from its Postgres checkpoint on approval with **zero additional AI requests**.
- One successful story-generation request on the configured free 3.5 Flash model produced hooks/script/supporting copy. The earlier successful footage index records its own generating model; model changes do not discard it. Provider compatibility checks encountered rejected/transient requests during integration; no quota stress test was performed.
- Browser acceptance saved the agent cut as revision 2 with changed title and cover text/theme, then exported it through the UI as an Instagram Reel. Native video reported **720×1280, 29.9 seconds, readyState 4**, and playback advanced normally. The actual private ZIP and unsigned-download denial were checked; the second account received 404 for runs, cuts, analysis and export links.
- The generated hook/script was applied and saved through the Story screen without another AI request. Cuts and Deliver were checked at a requested 375-pixel viewport (reported as 376 here), and expanded cover controls at 768 pixels, with no root horizontal overflow.
- Verification artifacts are ignored local files: `.local/demo-reel.mp4`, `.local/demo-editable.zip` and `.local/previews/core-demo-*.png`. They are actual outputs, not seeded product records. The user's source footage remains untouched.

Disposable verification accounts, their projects, private media and checkpoint threads were removed after acceptance. The local credential record and stale verification IDs were removed too. The browser is signed out at http://127.0.0.1:3000/; the frontend and API remain running locally for the user's own account.

## Practical limits and next work

Public Vercel/Render deployment is intentionally deferred at the user's request. Docker is not installed on this PC, so the Dockerfile has not been built locally; GitHub CI is prepared but no hosted run is claimed. Free hosting sleeps, and the API-hosted worker progresses only while its service is awake. Free Gemini availability and quotas are provider constraints.

Estimated timestamps need a creator's listening pass. The current implementation supports short source footage and one source per cut, with horizontal crop rather than face tracking. Cover previews use the source thumbnail; exports use a frame from the rendered cut. The cover SVG currently uses a portrait canvas. Publishing/scheduling, larger-source processing and Creator Intelligence remain deferred; inbuilt multi-track editing is excluded from current scope.

Next: introduce coordinator/Story/Research/Director subgraphs, typed persisted handoffs, missing-evidence requests, selective revisions and one shared budget. Simplify the primary UX around review and export without expanding editor scope. Then verify public deployment using human_setup.md; alignment/tracking follows measured quality needs.
