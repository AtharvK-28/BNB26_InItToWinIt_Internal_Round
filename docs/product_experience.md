# Product experience and design direction

Status: founder principles confirmed. The project/brief foundation now uses the shared warm studio direction in root DESIGN.md and has been rendered in the browser. Media review and editor-specific design are still proposed.

## Confirmed principles

Keep the experience simple, intuitive, creative, and polished from the initial skeleton. Avoid overwhelming creators or assembling a generic dashboard from stock-looking cards. Reuse accessible UI behavior while making layout, hierarchy, content, and interaction specific to creation work.

## Organize around the creator's project

Proposed top-level areas: **Projects**, **Library**, and later **Publishing**. Settings and account connections stay secondary. The product should not expose eight equal feature destinations or separate agent personalities that the creator has to manage.

The primary entry is one project and its output, not an analytics wall. Offer two understandable starting points: start an idea/script or work with existing footage. Both converge on the same project rather than separate products.

Within a project, organize the progression as **Material → Story → Cuts → Deliver**. These are proposed labels, not locked copy. The creator can move between them without losing work; script-first and footage-first workflows should both work.

## Proposed walkthrough

1. Create a project with a title and one primary action: add material or start the story. Avoid an onboarding questionnaire.
2. Import footage and optionally paste a script. Show thumbnails, playable previews, upload recovery, and meaningful processing stages.
3. Review an editable script with a small set of hook alternatives. When footage already exists, identify which suggestions are grounded in it.
4. See a script/footage view: click a beat to play source material; highlight missing sections and alternate takes. Never silently force a match.
5. Review a few candidate clips using real previews, their hook, approximate length, and a concise reason. Show source ranges on demand.
6. Open one clip in a focused editing workspace. The preview dominates; transcript and compact timeline make trims legible; selection opens relevant controls.
7. Choose YouTube or Instagram variant, inspect crop/captions/cover, edit metadata, and export. Publishing appears when a connection exists.

Provide context-sensitive AI actions such as find a better take, shorten this cut, or keep the full sentence. A small optional assistant can accept freeform requests, but the creator should not need to discover commands by chatting.

## Creative directions to explore

Explore a studio/workbench direction: media is the visual anchor, timeline marks have purpose, transcript evidence sits beside the preview, and typography helps distinguish story text from controls. Use careful space, one identifiable accent, and restrained transitions. The identity should come from a coherent product composition, not decorative gradients or unusual buttons alone.

This is a direction to prototype, not a final palette or mandatory dark mode. Test a warm/light production workspace against a dark media-review workspace using the same real project. Choose based on readability, creator feedback, and preview contrast. An editor may have specialized canvas treatment while retaining the same product tokens.

Do not make every page a landing page. Marketing-style hero rotation and ornamental typography should not disrupt the working application's stable navigation or precision controls. Distinctiveness must coexist with recognizable trim, play, selection, undo, and export interactions.

## Rules that keep it easy

- One dominant next action per stage. Offer more detail when the creator selects an object or requests advanced editing.
- Keep material, script, and output connected by source links; avoid duplicated asset pickers in every feature.
- Show a small candidate set initially; more suggestions remain available.
- Explain analysis using actionable states and coverage, not internal model or vector terminology.
- Use real source thumbnails, transcript spans, and editable drafts instead of decorative placeholder metrics.
- Make accepted AI changes undoable; show staged proposals and conflicts clearly.
- Autosave with a quiet saved indicator; meaningful failure messages offer a specific recovery action.
- Preserve project state when the user changes format or leaves and returns.
- Drag is convenient, but buttons, keyboard controls, and editable values also work.

## Polish checklist for the skeleton

Design empty, uploading, partial-analysis, ready, no-match, needs-review, rendering, failed, offline/reconnecting, and version-conflict states. The layout should not jump as results arrive. Playback and scrolling should remain responsive during processing.

Test the core screens with realistic transcript lengths, missing matches, long filenames, portrait/landscape assets, and small displays. Define a useful mobile review experience; do not cram a desktop multi-track editor into 320 pixels and call it responsive. Precision editing can stay desktop-focused with a deliberate smaller-screen fallback.

All controls need semantic labels, visible keyboard focus, and readable contrast. Selection must not rely on color alone. Reduced motion should preserve state feedback. No fake performance claims or invented counts in sample screens.

## How the design resources fit

Use Hallmark to choose and critique visual craft, UI UX Pro Max for targeted interaction/accessibility guidance, and selected OpenDesign systems as reference material. Once our tokens are chosen, all three should reinforce one CreatorAi system. Do not independently regenerate a palette on each screen. See design_tools.md for the installed skills and exact invocation examples.
