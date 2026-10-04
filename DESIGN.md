# CreatorAi studio system

Audience: individual creators and small production teams. First job: give an idea a project, draft the brief, and return to it. Tone: calm, tactile, precise, approachable.

Use a working studio composition: persistent workspace rail, a clear title/action, a project desk or writing surface, and secondary contextual notes. This is an application; Hallmark's marketing Workbench screenshots, repeated CTAs, page-theme rotation, and invented metrics do not apply.

The palette derives from Hallmark's Coral warm paper direction, with darker terracotta for readable action labels. Tokens live in `apps/web/src/app/tokens.css`. All component colours consume tokens. Manrope Variable headings and DM Sans Variable body are bundled with the application; no runtime Google Fonts request. Type is upright; headings stay functional.

The folio on the empty desk is an authored CSS composition representing an unwritten draft. It does not imitate a video preview or invent project content. Actual projects use text rows until real assets exist.

One strong action per page. Material, Story, Cuts and Deliver are working destinations. Current scope centers Cuts on candidate playback, source evidence, approval and revision requests. Show real tool/agent activity and explicit creator review without making the creator manage separate agent chats. Media previews come from actual imported files and rendered exports. No placeholder analytics or AI outputs.

An inbuilt video/image editor is out of scope. Existing experimental editing controls remain in code, but do not extend them or use them as the next milestone's design baseline. Preserve editable content through source-linked cut instructions, captions and layered export files. See docs/product_requirements.md and docs/agents_and_workflows.md for the target multi-agent responsibilities and handoffs.

Controls: at least 44px touch targets, visible focus, semantic labels, constant input borders, error text connected to fields, pending/saved/conflict states. Mobile uses a compact real navigation bar and stacked writing surface. Reduced motion disables transforms/animations. Keep these tokens and interaction conventions across later screens.

References applied: OpenDesign frontend craft, Hallmark hierarchy/tokens/states, and UI UX Pro Max accessibility/form guidance. The generic landing-page pattern returned by the design search was unsuitable for this working app and was not adopted.
