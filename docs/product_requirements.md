# Product requirements and scope

Updated: 4 October 2026.

The founder subsequently requested a finalized, deployable technical stack and a build from scratch, with implementation beginning in the next turn. [technical_stack.md](technical_stack.md) and [deployment_plan.md](deployment_plan.md) now define that baseline. The earlier research alternatives remain context, not competing implementation choices.

## Confirmed founder direction

CreatorAi is an AI-powered creator operations platform, with a polished and intuitive experience. Build a substantive product rather than a collection of prompted API calls. Research established approaches and reuse suitable open-source foundations before inventing editors, orchestration, or video analysis infrastructure.

The app must understand text and visual content efficiently. Speed matters alongside useful understanding. The system should use proper agents with tools and workflows where they add value, rather than calling background prompts or a retrieval chatbot an agent.

Keep the initial experience simple, creative, and easy to navigate. Avoid overwhelming creators with controls and avoid a generic generated dashboard. These constraints apply to the skeleton and interaction structure, not merely a final styling pass.

AI-generated content must remain editable. Video outputs should support normal editing operations. Graphic outputs should retain movable elements in a structured composition instead of becoming one flattened image. The founder's incomplete phrase about generating a whole image is interpreted here as generating an editable composition; confirm that interpretation when designing the graphic workflow.

Focus initially on YouTube and Instagram. Creator Intelligence is later and less essential. The supplied feature list identifies priorities, not eight equally sized features that all need full implementations in the first milestone.

## Proposed first complete experience

One creator adds a script and footage to a project. CreatorAi aligns the script to actual moments, offers a small set of evidence-backed short clips, and opens a selected clip as an editable timeline. The creator adjusts the cut, captions, crop, and hook, then exports YouTube Shorts and Instagram Reels variants. A landscape YouTube variant can use the same source and project.

This demonstrates asset management, generation, understanding, clipping, editing, adaptation, and workflow in one connected job. Direct publication is a separate integration milestone; export readiness and live publishing must have distinct statuses.

Initial persona proposal: solo creator or small creator team making spoken educational, commentary, interview, or product content. Start with speech-heavy footage while explicitly testing visual-only queries and B-roll. Do not describe a speech-only implementation as full visual understanding.

## Feature requirements

| Feature | First slice | Proposed completion check |
| --- | --- | --- |
| Asset management | Upload, previews, search, project links, processing status | Reuse an asset in a second output without reuploading or rerunning unchanged analysis |
| Script and hooks | Editable script with a few hook alternatives; footage-grounded hooks when footage exists | Save versions, edit text normally, and distinguish suggestions from spoken words |
| Script-to-video understanding | Match script beats to timestamped speech and visual evidence | Clicking a match plays its source range; missing and repeated takes remain visible |
| Clip generation | A few coherent candidates with source ranges and a short explanation | Open a candidate, trace its evidence, and adjust its beginning/end |
| AI editing | Non-destructive cuts, reorder, captions, crop, text overlays, audio level | Undo AI edits, reopen a saved draft, and rerender from the same project |
| Platform adaptation | YouTube Shorts, Instagram Reels; landscape YouTube if feasible | Preview format-specific crop, captions, cover, and metadata before export |
| Content workflow | Idea, material, draft, review, ready, export; durable job status | A failed render can resume without regenerating the script or reanalyzing the video |
| Creator Intelligence | Deferred; capture basic operational events now | No invented engagement prediction or performance metrics in the initial UI |

## Proposed limits to protect polish

Initially exclude advanced VFX, a complete Canva clone, professional color grading, arbitrary image layer recovery, a marketplace, dozens of platforms, fully autonomous publishing, and training a foundation model.

A supporting thumbnail/cover editor can be an adjacent milestone after the video experience works. It should share the asset library and project, and use a real layer document. We retain this requirement even if its implementation follows the first video slice.

## Proposed nonfunctional requirements

- Show usable partial results while analysis continues. No false progress percentages or silent spinner-only waits.
- Originals are immutable; projects contain references and changes. Saves are versioned and editor actions are undoable.
- Store evidence and model/version provenance so a creator can inspect why a clip was proposed.
- Video processing and rendering run outside short-lived web requests.
- Use tenant/project access checks for originals, derived files, and search results. Credentials stay on the server.
- Use bounded model/tool budgets and cancellable jobs. External publication has an explicit destination and creator review.
- Treat project edits made during an AI run as version conflicts, not permission to overwrite newer work.
- Provide keyboard and non-drag alternatives for editing actions, readable contrast, and reduced-motion behavior.

These are proposed acceptance criteria. No measured latency, accuracy, cost, scalability, or conversion targets exist yet; establish them using the experiments in multimodal_understanding.md.
