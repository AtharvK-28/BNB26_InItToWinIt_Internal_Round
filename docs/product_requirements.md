# Product requirements and current scope

Updated: 4 October 2026. Founder correction: prioritize a multi-agent creator workflow; an inbuilt video/image editor is not in the current scope. This supersedes earlier editor-centric requirements. The original problem statement remains unchanged as the source brief.

## Core experience

A creator supplies a brief/script and footage. Specialist agents collaborate to draft supporting content, find source evidence and propose useful clips. The creator reviews candidates, requests revisions or approves them, then downloads platform-ready videos and portable editable source material.

Keep the application polished, simple and project-oriented. It is an AI content operations workspace, not a video editor, Canva clone or agent-management console.

## In scope

| Area | Required slice | Acceptance |
| --- | --- | --- |
| Asset management | Private uploads, metadata, previews, project links and cached analysis | Immutable originals; analysis reuse with ownership/provenance |
| Scripts and hooks | Story Agent with brief/source tools and bounded revision behavior | Suggestions are grounded, versioned and explicitly accepted |
| Script-to-video understanding | Footage Research Agent retrieves speech and verifies selected visual windows | Source ranges, actual observations, uncertainty and missing matches are visible |
| Automated clips | Clip Director uses research evidence and can request more evidence | A few coherent candidates with valid source ranges and explained story connections |
| AI-assisted production | Agent-created structured cut/caption/crop instructions applied by FFmpeg | Creator can request a revision; originals and edit instructions remain available |
| Platform adaptation | YouTube Shorts / Instagram Reels; existing landscape preset remains available | Explicit preset and actual playable render; publication is a separate state |
| Content workflow | Coordinator, typed agent handoffs, shared budget, checkpoints and human review | Resume after interruption; retry affected work without repeating completed analysis |
| Editable output | MP4 plus source-linked JSON, SRT, copy and layered SVG where generated | Inspect/revise files externally without recovering structure from a flattened export |

## Out of current scope

- Inbuilt video timeline, trim/split/reorder UI, multi-track mixing, manual crop/caption precision tools, undo/history editor and editor-framework integration.
- Inbuilt image/cover canvas, drag layers and broader Canva-style graphic editing.
- Direct platform publishing/scheduling and Creator Intelligence.
- Long-form/unrestricted uploads, face tracking, advanced VFX and training foundation models.

The current implementation includes experimental cut/cover controls. They are existing extras, not required deliverables, and should not guide the next milestone. This documentation correction does not delete them; simplifying the runtime UI is a separate implementation change.

## Editable does not mean an embedded editor

Preserve immutable originals, versioned structured operations, captions and layer data. The creator approves or requests changes in CreatorAi and can continue manual editing externally. The present JSON/SRT/SVG package is portable data, not an import-ready Premiere/Resolve/CapCut project; external-editor compatibility must be verified before claiming it.

## Architecture and quality constraints

Use the specialist roles and handoff contracts in agents_and_workflows.md. Distinguish implemented single-agent behavior from the proposed multi-agent upgrade. Multiple model calls, tools or worker processes do not themselves count as multiple agents.

Enforce authenticated ownership on every artifact and tool; server-only credentials; bounded shared model/tool budgets; source-backed proposals; honest progress; safe quota failure; checkpoints and explicit creator review. Do not invent performance, visual proof or publication success.

Current prototype input limits are 40 MB / 180 seconds. Transcript timing is estimated. Public deployment is pending. Accurate alignment and stronger visual retrieval are later quality increments, not reasons to expand editor scope.
