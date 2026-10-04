# Core demo implementation

Updated 4 October 2026. Public deployment is postponed; the local frontend/API use the configured Supabase project.

## The working path

1. **Material:** import MP4/WebM/H.264 MOV footage, up to 40 MB and 180 seconds. Originals stay private and immutable, with metadata, thumbnails and SHA-256 identities.
2. **Story:** save an idea or script, then request hooks, a working script, two titles and supporting copy. AI results are separate saved runs. Choosing an opening fills the editor; the creator explicitly saves it.
3. **Cuts:** choose footage and a goal. A tool-using LangGraph agent reads the saved story, searches timestamped speech, inspects actual frames, and proposes up to three cuts. A durable interrupt waits for approval or revision feedback. A manual cut requires no AI call.
4. **Edit:** change in/out points, hook, title, post caption, horizontal framing, caption text and timing. Move two cover text layers, or use keyboard-accessible position controls. Saves check revisions; unsaved edits recover within the same tab.
5. **Deliver:** export Shorts/Reels at 720×1280 or landscape YouTube at 1280×720. Download a real H.264/AAC MP4 and ZIP with the edit document, source identity, SRT, caption and layered SVG cover. Direct social publishing is deferred.

## AI and free-tier controls

Gemini Flash uses Google's current **Interactions API**, `store=false`, low reasoning and no thought summaries. Schemas are simplified for the provider; Pydantic and media bounds remain authoritative. Opaque tool steps/signatures are retained privately for stateless conversation replay. The UI shows tool activity, never model thoughts. Execution is restricted to allowlisted tools.

The footage index combines mono 16 kHz audio with **eight sampled frames**. It is cached per owned asset and pipeline version; the generating model is recorded as provenance. Changing the drafting model does not force another analysis. Clip agents search this index and inspect at most two candidate windows with three actual frames each. They do not repeatedly send the full video. Quotes must occur in transcript segments overlapping the cut, and proposals must stay inside inspected windows. Script matches are model interpretations shown beside the evidence.

The single demo worker spaces requests at least 15 seconds apart. An agent pass allows at most six reasoning turns, eight tool calls and two visual inspections. There are no automatic provider retries, paid fallbacks, grounding/search charges, or AI calls on page loads, manual edits, review approval or exports. Revision feedback permits two additional agent passes. Successful runs retain request counts and provider-reported tokens; free quotas remain account-specific.

Transcription times are **model estimates**, not forced word alignment. Creators can correct captions against the source. Sparse frames cannot establish every intervening action. Accurate local transcription/alignment, scene detection, speaker-aware reframing and long-form inputs remain later improvements. Cover previews use the source thumbnail; exported covers use the rendered cut's first frame.

## Queue, persistence and deployment

Migration `0003` adds runs, analyses, clips and exports in private schema `creatorai`. Every API enforces ownership. PostgreSQL RLS is enabled; API filters remain the tenant boundary because the backend role can bypass RLS.

The database queue uses atomic claims, 20-second heartbeats and three-minute leases. Expired jobs return to the queue. Agent checkpoints use private `creatorai_agent` tables on Supabase or SQLite locally. Retries resume checkpoints and reuse analysis; a reload restores job status. Exports freeze the saved clip revision so later edits cannot change a render already in progress.

`ENABLE_DEMO_WORKER=true` runs one worker inside the free demo API. For a separate worker, set that API flag false and run `python -m creatorai.worker`. Sleeping free hosts pause processing until they wake; Postgres retains jobs/checkpoints. Production processing needs an always-on worker.

The Render Dockerfile includes FFmpeg and DejaVu fonts. Requirements are frozen from `uv.lock`; Vercel retains its cloud configuration guards. Private Supabase Storage must allow `application/zip` alongside video/JPEG types. A local Docker build and public release still require host verification.

## Verification approach

Most checks use mocked AI, real FFmpeg and durable LangGraph checkpoints, consuming no quota. `tests/test_demo.py` covers review across restarts, cached index reuse, revision conflicts, real render dimensions, editable packages, tenant isolation, idempotency and cancellation. `tests/test_ai.py` covers Interactions serialization, schema projection, tool-step/call-ID replay and absence of automatic quota retries.

`docs/tools/demo_smoke.py` separates explicit AI submissions from read-only status/verification. It uses disposable Supabase accounts and supplied demo footage. Status calls never submit AI work. Generated credentials and outputs remain ignored in `.local`.

## Primary references

- [Gemini Interactions overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Interactions API reference](https://ai.google.dev/api/interactions-api)
- [Structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Stateless function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Gemini free-tier pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
