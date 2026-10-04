# Editable outputs without an inbuilt editor

Updated: 4 October 2026. Inbuilt video and image editors are outside the current scope. Earlier timeline/canvas integration recommendations are superseded. The requirement to retain editable AI content remains.

## Required output model

The original footage remains immutable. AI produces a validated, versioned document describing source ranges, caption text/timing, framing, supporting copy and platform settings. FFmpeg renders the document; the rendered MP4 is not the only retained artifact.

The current package contains:

- video.mp4: playable platform export.
- edit-plan.json: source identity, preset and structured cut document.
- captions.srt: timed subtitle text.
- caption.txt: supporting post copy.
- cover.svg: separate editable text layers over a retained image, where a cover is generated.

Creators can approve candidates or request agent revisions in CreatorAi. Detailed manual editing happens in external tools. SVG text layers remain movable/editable in compatible vector tools; a raster layer's internal objects do not become editable elements.

## Honest interoperability

JSON is an inspectable source plan, not automatically a Premiere/Resolve/CapCut project. SRT and SVG are portable files, but compatibility and timing must be tested in the intended external application. Do not claim one-click professional-editor import until an adapter and its acceptance test exist.

Retain asset IDs, source hashes, source times, output settings, provenance and document version. A source identifier does not itself distribute the original file; originals remain separately downloadable through authorized access. A future interchange adapter can map this retained information to an external editor format without adding a browser editor.

## Validation and reproducibility

Validate owner access, source bounds, forward duration, caption ranges, platform preset and expected revision before rendering. Freeze the approved document revision for each export. Preserve previous approved results when an agent proposes a revision; never overwrite immutable originals.

Current caption timing is model-estimated and needs review. Current cover exports use a portrait canvas. Multi-track timelines, arbitrary image layer recovery, full undo/editor histories and preview/export parity for a complex editor are not current requirements.

## Existing prototype controls

The code contains cut trimming, caption/crop controls and a two-text-layer cover editor from the previous increment. They are implemented extras, not the scope baseline. This docs-only correction leaves them intact. A future implementation pass should simplify the main experience around review and agent revision, rather than extending them.

OpenCut, Konva, Fabric, Remotion and other editor research remains in research_references.md as background. None is required to deliver the current multi-agent workflow or portable export package.
