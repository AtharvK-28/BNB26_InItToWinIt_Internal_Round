# Free-first prototype plan

Founder constraint, 4 October 2026: this is a prototype; keep it mostly free and explore cheap options only where they help. This supersedes the mandatory paid-service assumptions in the earlier deployment plan.

## Now: no service bill

Run Next.js and FastAPI on the development machine. Use SQLAlchemy with SQLite for the project/brief milestone. Add local files and CPU media tools in the media milestone. No provider account, external inference, cloud storage, always-on worker, or GPU is required today. Local hardware, disk space, and electricity still bound the workload.

Keep Python business logic separate from the web UI. SQLite is a development adapter; the project identifiers, validation, and optimistic revision contract are retained when we introduce Postgres. Install features when their milestone needs them, rather than installing the entire selected stack immediately. Plain token-based CSS is sufficient for this shell; Tailwind/Radix remain optional additions for later interactions. Native inputs avoid unnecessary custom-control complexity.

## Hosted options investigated

These are verified upstream offers, not provisioned resources. Recheck quotas and terms before deploying.

| Option | Prototype fit | Limitation that matters |
| --- | --- | --- |
| [Supabase Free](https://supabase.com/pricing) | Hosted Postgres and Auth when we add accounts | 500 MB database, 1 GB file storage, 50 MB maximum single upload, 5 GB egress; inactive projects pause. Free storage cannot be our unrestricted raw-footage upload path. |
| [Render free web service](https://render.com/docs/free) | Lightweight demo API with external database | Sleeps after 15 minutes idle; local files/SQLite disappear on restart or sleep; free background workers unavailable. Persist in Postgres before using it. |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Personal noncommercial frontend demo | Noncommercial personal-use restriction. Verify project eligibility before choosing it for a team/commercial product. |
| [Modal Starter](https://modal.com/pricing) | Optional GPU experiment for a later media benchmark | Advertised monthly compute credits are capped; overage and shared endpoints can be billed. This is not unlimited free inference. |
| [Gemini API free tier](https://ai.google.dev/gemini-api/docs/pricing) | Optional reasoning adapter, subject to model/account quota | Model-specific availability/rate limits; free-tier data-use terms differ from paid. Verify the exact model and account before wiring it in. |

No cloud services, billing accounts, or model calls were enabled by this increment. The full Render API + agent worker + media worker + persistent broker topology remains a later option, not a prototype prerequisite.

## How we add the remaining stack

1. **Foundation now:** projects and editable briefs, real persistence, clean interface.
2. **Material next:** upload a small real clip, inspect with ffprobe, save original plus metadata, thumbnail and player; no inference needed yet. Add bounded local storage and upload limits.
3. **Understanding:** benchmark CPU faster-whisper with a smaller model and cached frame sampling on our actual clips; compare quality/latency before committing to large-v3 or a paid GPU. Larger-model baseline remains a target, not a hardware assumption.
4. **Story tools/agents:** integrate LangGraph with real typed project/media tools and persisted review checkpoints; use a free quota or a local reasoning adapter where it meets measured requirements. No simulated AI success.
5. **Editable cuts/export:** versioned timeline plus deterministic FFmpeg; add the focused editor controls incrementally.
6. **Shared demo:** Supabase Auth/Postgres, tenant isolation, cloud media storage strategy, then hosted frontend/API. Separate durable processing from sleeping free HTTP services. Any local worker requires the machine to stay online; document that availability.

Choose a paid component only after a measured bottleneck or an actual demo requirement makes its purpose clear. Record the reason, expected cap, fallback, and cost before provisioning it.
