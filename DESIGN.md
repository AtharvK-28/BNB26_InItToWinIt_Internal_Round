# CreatorAi design system

Audience: individual creators and small production teams. First job: start a project from a script or footage, get clips out, and come back tomorrow to what's next. Tone: friendly, confident, uncluttered. The visual language follows Airbnb's: white surfaces, one coral accent, generous whitespace, photo-first cards and rounded, soft-shadowed controls.

## Tokens

All tokens live in `@theme` in `apps/web/src/app/globals.css` and are used through Tailwind utilities (`bg-rausch`, `text-ink-2`, `border-line`, `shadow-card`). Don't hard-code new colors in components; add a token if one is genuinely missing.

| Role | Token | Value |
| --- | --- | --- |
| Accent (one per view: primary action, active state) | `rausch` / `rausch-dark` / `rausch-soft` | #FF385C / #E00B41 / #FFF0F3 |
| Text | `ink` / `ink-2` / `ink-3` | #222222 / #6A6A6A / #929292 |
| Lines | `line` / `line-soft` | #DDDDDD / #EBEBEB |
| Quiet fills | `surface` / `surface-2` | #F7F7F7 / #F2F2F2 |
| Status (with icon or label, never color alone) | `babu` (good), `amber` (warning), `arches` (error), `sky` (info), each with `-soft` | |

Type is Figtree (`next/font`, self-hosted at build time): semibold headings, 14–16px body, `text-ink-2` for secondary copy. Radii: 8px inputs, 12px tiles, 16px cards, full pills for chips, search and header buttons. Shadows are `shadow-soft` (resting), `shadow-card` (hover), `shadow-search`, `shadow-panel` and `shadow-float` (popovers, floating buttons).

AI-generated content is marked with the gradient utilities `ai-border`, `ai-bg`, `ai-text` and the `AiSpark` icon, so creators can always tell suggestions from their own work. The `btn-rausch` gradient is reserved for the single strongest action on a page.

## Components

Reuse `components/ui` before writing new controls: `Button`/`IconButton`, `Chip`, `Segmented`, `Toggle`, `Pill`, `Modal`/`Sheet`/`Popover`, `Photo`/`Avatar`, `PlatformBadge`/`PlatformChip`, `AiSpark`/`AiThinking`/`Markdown`. The studio shell is `StudioHeader` (five primary tabs plus a grouped Menu) with `MobileNav` below 768px. Video pipeline screens live in `components/video` and share `ProjectPage` (title, platform chips, the Material → Story → Cuts → Deliver stepper).

## Layout

- Pages open with a large title, one line of context and at most one primary action on the right.
- Cards are photo-first: a 16:9 or square media area with a pill badge top-left, then a semibold title and grey meta lines, no borders around the text.
- Lists and grids get an empty state with an icon, one sentence and one action; loading states use `skeleton` blocks shaped like the content.
- Wrap pages in `Shell` (1280px reading width, or `wide` for 1760px grids) with 16–80px gutters; everything works at 390px wide without horizontal scroll.

## Product rules

- Production data is real. Media previews come from imported files and rendered exports; insights on projects are computed from the API. Don't invent AI outputs, metrics or previews.
- The creator stays in control: AI proposals are reviewed explicitly, edits save as revisions, and conflicts are shown, not overwritten.
- The cut editor is limited to what the renderer applies (trim, title, hook, framing, captions, cover). Previews must match the export; if the renderer changes, change the preview with it.
- Floating elements must not cover working controls. The copilot launcher is hidden inside project workspaces, where the header button remains.

## Accessibility

Touch targets of at least 44px, visible focus, labelled inputs with constant borders, error text next to its field, and pending/saved/conflict states for anything that saves. Respect reduced motion. Never rely on color alone for status.
