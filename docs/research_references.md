# Research references and verification notes

Researched: 4 October 2026. Prefer primary papers, official documentation, and upstream source. Repository claims describe upstream capabilities, not a locally verified CreatorAi integration. The subsequent stack decision is authoritative in [technical_stack.md](technical_stack.md); alternatives here remain historical research.

## Sources checked for the finalized deployment stack

- [Render background workers](https://render.com/docs/background-workers), [Key Value](https://render.com/docs/key-value), and [deployment lifecycle](https://render.com/docs/deploys): selected API/worker/broker host, Redis-compatible queue and ephemeral container filesystem.
- [Supabase resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads), [storage policies](https://supabase.com/docs/guides/storage/security/access-control), and [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector): selected managed storage/search features.
- [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys), and [database connections](https://supabase.com/docs/guides/database/connecting-to-postgres): auth verification and pooler selection references.
- [Modal job processing](https://modal.com/docs/guide/job-queue), [GPU functions](https://modal.com/docs/guide/gpu), and [cold starts](https://modal.com/docs/guide/cold-start): asynchronous inference and cache/warmup tradeoffs.
- [Celery Redis broker](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html) and [tasks](https://docs.celeryq.dev/en/stable/userguide/tasks.html): retry/acknowledgement semantics; not an exactly-once guarantee.
- [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [function calling](https://ai.google.dev/gemini-api/docs/function-calling), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), and [image generation](https://ai.google.dev/gemini-api/docs/image-generation): current Google reasoning/tool/optional-artwork adapters. Avoid copying the obsolete model IDs from inspected third-party editor code.
- [LangChain Google integration](https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai): one adapter option for tool calls within LangGraph; native Google SDK is sufficient where that adapter is unnecessary.
- [multilingual E5 model card](https://huggingface.co/intfloat/multilingual-e5-small/raw/main/README.md), [OpenCLIP weight card](https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K): selected retrieval baseline; pin actual weight revisions during implementation.
- [Uppy Tus](https://uppy.io/docs/tus/), [Tiptap](https://tiptap.dev/docs/editor/core-concepts/introduction), and [current dnd-kit React quickstart](https://dndkit.com/react/quickstart/): reusable upload/editing primitives, with a custom product surface.
- [Vercel function limits](https://vercel.com/docs/functions/limitations) and [Next.js hosting](https://vercel.com/docs/frameworks/full-stack/nextjs): frontend hosting, with media uploads and execution kept separate.
- [SQLAlchemy async support](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) and [Node releases](https://nodejs.org/en/about/previous-releases): selected language/runtime and persistence references.

The timeline-specific [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor) was also inspected as an MIT animation timeline primitive. It was not selected as a video engine or bootstrap dependency: current React compatibility and end-to-end media behavior were not verified. The chosen baseline uses a focused editor built from reusable primitives and command patterns.

## Most useful starting references

| Resource | Why it matters | How to use it |
| --- | --- | --- |
| [Edit Mind](https://github.com/IliasHad/edit-mind) | Existing video index with transcription, frame analysis and natural-language search | Study the analysis/indexing boundaries; README explicitly says not production-ready |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Practical speech inference with published batching/precision benchmarks | Benchmark on our hardware and language mix; do not reuse its speed claims as our own |
| [WhisperX paper](https://arxiv.org/abs/2303.00747) and [implementation](https://github.com/m-bain/whisperX) | Word timing and long-form transcription/alignment | Test caption and cut-boundary improvements against extra dependencies |
| [Qwen3-VL-Embedding/Reranker](https://github.com/QwenLM/Qwen3-VL-Embedding) | Official multimodal retrieval route across text/images/video | Compare with the cheaper frame/text baseline; verify checkpoint terms and actual memory/latency |
| [QVHighlights / Moment-DETR](https://arxiv.org/abs/2107.09609) and [code](https://github.com/jayleicn/moment_detr) | Query-specific moment localization and highlight detection | Understand the task and evaluation; public benchmark performance is not finished-clip quality |
| [Lighthouse](https://github.com/line/lighthouse) | Reproducible moment retrieval/highlight model toolkit | Candidate experiment framework if specialized retrieval earns its complexity |
| [OpenCut Classic](https://github.com/opencut-app/opencut-classic) | Editable timeline and command/undo patterns | Study isolated modules; archived, so importing the entire application adds maintenance burden |
| [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview), [persistence](https://docs.langchain.com/oss/python/langgraph/persistence), [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) | Tool loops with explicit state and human review | Implement one bounded creator workflow; separate it from heavy media job execution |

## Additional useful primary sources

- [VideoCLIP paper](https://arxiv.org/abs/2109.14084): video/text representation background.
- [VideoCoCa paper](https://arxiv.org/abs/2212.04979): alternative video/text modeling background.
- [Qwen2.5-VL technical report](https://arxiv.org/abs/2502.13923): temporal and dynamic-resolution modeling background.
- [OpenCLIP](https://github.com/mlfoundations/open_clip): image/text encoder implementation to evaluate as a cheaper visual retrieval baseline.
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect): cut/transition detection, not full semantic understanding.
- [pgvector](https://github.com/pgvector/pgvector): vector search inside Postgres; official README discusses combining it with full-text retrieval.
- [Auto-Editor](https://github.com/WyattBlue/auto-editor) and [v3 format](https://auto-editor.com/docs/v3): automated cuts and a nonlinear timeline representation.
- [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO): editorial interchange rather than preview/render/editor UI.
- [Konva React guide](https://konvajs.org/docs/react/index.html) and [license](https://github.com/konvajs/konva/blob/master/LICENSE): canvas composition/editing primitives.
- [Fabric.js](https://github.com/fabricjs/fabric.js) and [license](https://github.com/fabricjs/fabric.js/blob/master/LICENSE): alternative object canvas foundation.
- [SAM 2 paper](https://arxiv.org/abs/2408.00714) and [source](https://github.com/facebookresearch/sam2): segmentation for optional cutouts; not recovery of editable image structure.
- [Inngest durable execution](https://www.inngest.com/docs/durable-execution), [durable agents](https://www.inngest.com/docs/durable-execution/durable-agents), [AgentKit agents](https://agentkit.inngest.com/concepts/agents): TypeScript-friendly orchestration alternative to compare.
- [Temporal docs](https://docs.temporal.io/): durable workflow infrastructure to revisit if operational complexity grows.

## Editors: current identities and source inspection

Older links can resolve to renamed projects or changed licensing. These commit IDs record the versions inspected; they are not editor code downloaded into CreatorAi.

| Repository | Inspected commit | Verified status / notices |
| --- | --- | --- |
| OpenCut-app/OpenCut | e668010778568641babef2cc40be4703ae6916d6 | MIT; README states rewrite in progress and directs current users to Classic |
| opencut-app/opencut-classic | cf5e79e919144200294fb9fed22a222592a0aeea | MIT; archived/no longer maintained |
| trykimu/videoeditor | 6a30d43c5d2c381940478d89e4c712f40fd85146 | AGPL v3/commercial dual license in LICENSE.md; README also flags relevant Remotion terms |
| openvideodev/react-video-editor | 9a8c5296da4b258f66dfb7ad73de96be62478bca | README describes free/company tiers; do not assume MIT based on old DesignCombo posts |
| WyattBlue/auto-editor | 43cb036af0b924fc4719e5b3a1e90db3ae79efb6 | Unlicense |
| AcademySoftwareFoundation/OpenTimelineIO | fc5c58e16f6832972cdb5c656dd8a6d87a4e5b02 | Apache-2.0 |
| line/lighthouse | 3e841d3d662c8440afed514908566fed2d5e82a7 | Apache-2.0 |

Read actual license files, not only GitHub's SPDX detection: some permissive licenses return NOASSERTION in metadata. For example, Konva's LICENSE was read directly and is MIT. A failed lookup for Kimu's bare LICENSE was resolved by finding its actual LICENSE.md and LICENSE-AGPL3.md paths.

Concrete code inspected: OpenCut Classic's base command, command manager, and the beginning of split-elements; Kimu's AI route and editable timeline schema. The reviewed patterns support a typed-command approach, but no full renderer audit or integration smoke test has happened. See editable_media.md for links to these pinned source files.

Additional licensing references: [Kimu LICENSE.md](https://github.com/trykimu/videoeditor/blob/6a30d43c5d2c381940478d89e4c712f40fd85146/LICENSE.md), [OpenVideo README](https://github.com/openvideodev/react-video-editor/blob/9a8c5296da4b258f66dfb7ad73de96be62478bca/README.md), and [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). Treat them as selection constraints and verify exact dependency versions before implementation.

## Existing products for workflow research

- [Descript](https://www.descript.com/tools/video-editor): transcript-driven editing can make cuts accessible to creators.
- [OpusClip](https://www.opus.pro/): long-form to short-form clipping/adaptation workflow to examine.

Their sites document product positioning; this research pass did not perform hands-on competitive testing or independently validate quality claims. Study where they help creators make decisions, then choose CreatorAi's own workflow.

## Design resources requested by the founder

- [OpenDesign](https://github.com/nexu-io/open-design): full workspace plus portable skills/systems. Only selected resources and the frontend skill were loaded.
- [Hallmark](https://github.com/nutlope/hallmark): visual craft and anti-generic design methods. Existing installed skill retained; pinned project copy added.
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): local UX/style guidance with executable search. Installed and one targeted lookup verified.

Exact commits, content hashes, licenses, and usage details are in design_tools.md and design-resources/manifest.json.

## Publishing references and limits

- [YouTube videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert): official upload API reference read during research.
- [Meta's official Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api): primary-source fallback found when the Meta documentation page failed to open. Instagram Login and Facebook Login flows have different setup requirements.
- [Meta content publishing docs](https://developers.facebook.com/docs/instagram-platform/content-publishing/): could not be read successfully with the research browser; recheck current official docs when building the integration.

No API access, account eligibility, permissions, quotas, or live publication was tested. The initial proposal is export-first, with direct publication as a separate verified integration milestone.

## What remains unverified

All CreatorAi performance and quality expectations, GPU requirements of the selected deployment, preview/export parity, browser media behavior, editor integration effort, and usability of the proposed screens. Research reduces uncertainty; the experiments in multimodal_understanding.md and architecture_and_delivery.md turn recommendations into implementation decisions.
