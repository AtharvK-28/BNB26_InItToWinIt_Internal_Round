# Editable AI media and reuse strategy

Status: version-one integration strategy selected in [technical_stack.md](technical_stack.md). Use React/Konva/dnd-kit primitives, selected MIT command-pattern reuse, a CreatorAi document, and FFmpeg export. No editor has been integrated or locally tested; the examples below are explanatory rather than final schemas.

## Core rule

AI generates a structured project and typed edit operations. MP4, PNG, and JPG are exports derived from that project. Creators and AI use the same edit model, so AI work remains inspectable, undoable, and reopenable.

Keep originals, analysis results, editable project revisions, previews, and exports separate. A creator should never need to reupload an AI-rendered MP4 to correct its captions or change its cuts.

## Video project model

Persist canvas dimensions, rational frame rate/timebase, tracks, asset references, source ranges, output positions, transforms, crop/focus keyframes, text/captions, audio settings, version, and provenance. Avoid making timeline pixel coordinates the canonical time representation.

Use integer ticks or rational times internally. The following milliseconds example is explanatory, not the final production schema:

```json
{
  "schemaVersion": 1,
  "revision": 4,
  "canvas": {"width": 1080, "height": 1920},
  "clips": [{
    "id": "clip-01",
    "assetId": "asset-raw",
    "sourceInMs": 12400,
    "sourceOutMs": 21800,
    "timelineStartMs": 0,
    "transform": {"fit": "cover", "focusX": 0.5, "focusY": 0.4},
    "origin": {"kind": "ai-proposal", "evidenceIds": ["u-12", "w-08"]}
  }],
  "captions": [{"startMs": 0, "endMs": 1200, "text": "Example caption"}],
  "layers": [{"id": "hook", "kind": "text", "text": "A creator-editable hook"}]
}
```

A cut changes source ranges and output positions. A caption is editable text with timing and style. A crop has editable framing data. Reordered clips require remapping captions and preserving audio sync. Captions and hooks remain separate from source speech.

AI should propose operations such as trim_clip, split_clip, reorder_clip, set_caption, set_crop, and insert_text_layer. Validate asset ownership, bounds, overlaps, durations, and project version. Apply a coherent batch atomically and keep undo data. Provide the same capabilities through manual controls.

## Editor candidates and what to learn

| Project | Verified upstream finding | Proposed use |
| --- | --- | --- |
| [OpenCut main](https://github.com/OpenCut-app/OpenCut) | MIT; README says a rewrite is underway, with APIs/MCP/headless support described as coming | Watch architecture, but do not assume the new engine is ready to embed |
| [OpenCut Classic](https://github.com/opencut-app/opencut-classic) | MIT; archived and no longer maintained; source has command history and timeline operations | First source-study candidate for cut/split/undo patterns; isolate any reused modules rather than inherit the whole app |
| [Kimu](https://github.com/trykimu/videoeditor) | AI editing route and structured timeline schema; AGPL/commercial dual license; relevant Remotion terms also apply | Study separation of AI planning and editable state; not the default code-copy choice |
| [OpenVideo React editor](https://github.com/openvideodev/react-video-editor) | Multi-track UI and engine packages; README describes free/company tiers, not blanket MIT reuse | Consider only after confirming license and integration needs; older DesignCombo links are stale references |
| [Auto-Editor](https://github.com/WyattBlue/auto-editor) | Unlicense; [v3 timeline](https://auto-editor.com/docs/v3) describes editable nonlinear timeline data | Practical reference/tool for silence-based cuts and export workflows; not semantic clip intelligence |
| [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | Apache-2.0 editorial interchange API/format | Possible interchange layer later; not a browser editor or renderer |

OpenCut Classic source inspected at cf5e79e919144200294fb9fed22a222592a0aeea includes [base command](https://github.com/opencut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/commands/base-command.ts), [command manager](https://github.com/opencut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/core/managers/commands.ts), and a split-elements command path. The command base and manager were read; a source tree listing is not an integration test.

Kimu source inspected at 6a30d43c5d2c381940478d89e4c712f40fd85146 includes [AI route](https://github.com/trykimu/videoeditor/blob/6a30d43c5d2c381940478d89e4c712f40fd85146/backend/ai/routes.py) and [timeline/AI schema](https://github.com/trykimu/videoeditor/blob/6a30d43c5d2c381940478d89e4c712f40fd85146/backend/ai/schema.py). Its UI-oriented coordinates are an implementation example, not the recommended canonical time model for CreatorAi.

Recommendations above describe engineering reuse fit. Before incorporating code, preserve the exact applicable notices and inspect dependencies; a public repository and permissive root license do not automatically settle every bundled component's terms.

## Minimum useful video editor

Start with preview, source-linked transcript, a compact timeline, trim/split/reorder, caption text/timing, hook overlay, framing/crop, audio level, undo/redo, autosave, and export. Reveal detailed controls on selecting the relevant element. Defer advanced effects and arbitrary multi-track complexity until creator needs justify them.

Prove three things before selecting an editor foundation: serialize/reopen an AI-created draft, manually change it and undo, then export it with matching timing/layout. Include an original with variable frame rate and a multi-cut sequence. Preview quality alone is insufficient.

FFmpeg is the selected first server export engine for basic edits; verify exact build configuration and dependency terms when packaging. Browser preview and server rendering must interpret the same document. Share layout/font rules and compare representative frames. [Remotion](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) remains a researched alternative with its own license; it is not a selected runtime dependency or a complete timeline editor.

## Editable graphics

Generate a composition with independent background, image/cutout, text, shapes, and decorations. Retain stable layer IDs, stacking order, positions, sizes, crop, color, font/style, locks, and asset references. Render a preview and export only after composing those elements.

Example: a YouTube cover has a generated background image, a creator photo cutout, a real text layer, and a shape layer. The creator can move the subject, edit the title, or replace the background without regenerating the entire design.

[Konva/react-konva](https://konvajs.org/docs/react/index.html) and [Fabric.js](https://github.com/fabricjs/fabric.js) are candidate canvas foundations with permissive licenses verified in source. They provide primitives, not all Canva behaviors. Define our own versioned composition schema and adapt it to the renderer instead of coupling all storage to transient canvas/UI state.

A generated raster's internal objects do not become editable layers just because it is placed on a canvas. Layered generation must create components separately. [SAM 2](https://github.com/facebookresearch/sam2) can assist segmentation, but masks do not recover hidden backgrounds, fonts, or original editable text; segmentation is an optional later enhancement.

## Adaptation for YouTube and Instagram

Use one source-linked master with format variants, not independent flattened duplicates. Each variant overrides dimensions, crop, safe-area guides, caption layout, cover, and metadata while retaining an editable relationship to the master. A change to the master needs clear propagation/override behavior.

Proposed initial presets: YouTube landscape 16:9, YouTube Shorts 9:16, Instagram Reels 9:16. The dimensions are our design presets, not a claim to implement every platform acceptance rule. Version export validators and verify current official requirements during the publishing integration stage.

Vertical reframing needs subject/action evidence plus a manual fallback. Multi-speaker footage, screen recordings, and demonstrations may require split layout or fit-with-background rather than blindly center-cropping.
