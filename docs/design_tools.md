# Design resources and skill usage

Loaded: 4 October 2026. Resources are pinned and copied with licenses; no upstream design application or MCP service was launched.

## What is available

Portable setup on another PC uses the checked-in snapshots, with no downloads or global account paths:

```powershell
python docs/tools/setup_design_skills.py
python docs/tools/setup_design_skills.py --install
python docs/design-resources/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/scripts/search.py "form validation" --domain ux -n 2
```

The first command verifies all 204 SHA-256 hashes offline. The optional second command copies the three skills to ignored `.agents/skills/`; it preserves existing installations. Restart the agent to discover them, or explicitly name the portable SKILL.md paths below. Hallmark's site CSS is available in its pinned `docs/design-resources/hallmark/site/css/` directory. Root AGENTS.md tells agents where to find these resources.

GitHub can include the snapshots and their retained license notices. See `THIRD_PARTY_NOTICES.md`. Generated skill copies, dependencies, env files, databases, local FFmpeg binaries and verification credentials stay ignored. The current product design is locked in root `DESIGN.md`; reference palettes are not automatically adopted.

| Requested repository | Loaded in this project | Codex skill status |
| --- | --- | --- |
| [OpenDesign](https://github.com/nexu-io/open-design) | Selected frontend and web-design-guidelines skills; Figma and Notion design references; upstream notices | Its frontend skill installed as folder open-design-frontend; declared skill name remains frontend-design |
| [Hallmark](https://github.com/nutlope/hallmark) | Full Hallmark skill and references plus site CSS needed for theme references | Hallmark was already available at C:/Users/Aditya/.agents/skills/hallmark; that existing copy was preserved |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Complete selected skill with data, scripts, references and upstream license | ui-ux-pro-max installed into C:/Users/Aditya/.codex/skills/ui-ux-pro-max |

Newly installed skills will be available on the next Codex turn. Explicit file-path prompts also work with the local reference copies if automatic discovery does not list a skill. A skill supplies instructions and supporting resources to the coding agent; it does not add app runtime functionality by itself.

The project copies contain **204 upstream files**, approximately **4.78 MB** total before the manifest. They are selected snapshots, not full repository clones. [manifest.json](design-resources/manifest.json) records the exact commits, file sizes, and SHA-256 hashes. The loader verifies downloaded content against each pinned Git blob.

Pinned commits:

- OpenDesign: 53231d40b778d88eba23f35547bf99485d3ae9fc
- Hallmark: 13ac0ec7e148655948100b6396439e481361d690
- UI UX Pro Max: 477bcb28c9812b385cb51a4605ddf30d7b2266e2

Root licenses are Apache-2.0, MIT, and MIT respectively. Per-skill notices are retained too. Reference systems, third-party assets, and brand names should not be treated as permission to duplicate someone else's product identity.

## Recommended division of responsibility

1. Founder requirements and the chosen CreatorAi design system define the product.
2. Hallmark guides visual hierarchy, tokens, interaction states, and critique.
3. UI UX Pro Max supplies targeted UX/accessibility/stack guidance; its generated suggestions remain proposals.
4. OpenDesign supplies optional craft instructions and reference systems. The full OpenDesign application is unnecessary to use these files.

The Figma and Notion reference systems were selected for studying tool/workspace interactions, not chosen as the CreatorAi brand. Do not copy all their components or mix their palettes.

Hallmark includes page variety and theme rotation rules. In a working app, our agreed need for stable navigation and one consistent product system takes precedence over rotating the brand between screens. Apply expressive page structure where appropriate; keep editor mechanics understandable.

## Natural-language prompts

For a new project workspace:

> Use Hallmark and docs/product_experience.md to design CreatorAi's project workspace. Keep the main job script-and-footage to editable clips. Show realistic material and review states. Use one cohesive CreatorAi design system and stable app navigation.

For review without code edits:

> Hallmark audit the project workspace and clip editor. Rank problems in hierarchy, usability, consistency, and visual craft. Do not edit yet.

For a focused UX issue:

> Use ui-ux-pro-max to check timeline reordering. Include keyboard and single-pointer alternatives to dragging, clear selection, and undo. Keep the existing product tokens.

For OpenDesign's installed frontend craft:

> Read C:/Users/Aditya/.codex/skills/open-design-frontend/SKILL.md and use its frontend-design workflow for CreatorAi's clip review screen. Follow docs/product_experience.md and the selected product tokens.

For the portable local copies:

> Read docs/design-resources/hallmark/skills/hallmark/SKILL.md and only relevant references. Use it for this design task; follow the CreatorAi requirements first.

> Read docs/design-resources/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/SKILL.md and use a targeted UX search for this interaction.

> Read docs/design-resources/open-design/skills/frontend-design/SKILL.md and study the selected design-system files as optional references.

Use a file path when a skill's installation folder and its declared name differ. The current open-design-frontend folder's SKILL.md declares frontend-design; do not assume `$open-design` invokes the whole OpenDesign workspace.

## UI UX Pro Max local search

The system `py -3` launcher was broken in this session (it pointed to an absent C:/Python313/python.exe). The bundled runtime worked. These PowerShell commands use its verified path:

```powershell
$creatorPython = 'C:\Users\Aditya\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$creatorUxSearch = 'C:\Users\Aditya\.codex\skills\ui-ux-pro-max\scripts\search.py'
& $creatorPython $creatorUxSearch 'dragging movements' --domain ux -n 2
& $creatorPython $creatorUxSearch 'creator video workspace' --design-system -p 'CreatorAi' -f markdown
```

The targeted dragging search was run successfully and returned guidance about alternatives to drag-only interactions. A design-system generation was not run or persisted; the product's visual direction remains open.

The local project copy has the same search script under docs/design-resources/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/scripts/. Use the full script path, and inspect query fit before adopting results. The runtime cache version/path may change across machines; discover the bundled dependencies again when needed.

## OpenDesign scope

OpenDesign is a full collaborative design workspace as well as a collection of portable skills and systems. Its CLI/MCP/server/desktop setup is separate from using its skill files. This pass installed the lightweight frontend skill and loaded selected references only. It did not configure `od`, hosted access, telemetry, models, accounts, or services.

The optional full workspace can be evaluated later if live artifact collaboration is useful. Our current app build does not require it.

## Reproducible resources

From the repo root, use the loader with a working Python runtime:

```powershell
& 'C:\Users\Aditya\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' docs/tools/load_design_resources.py
```

The loader only writes selected resource snapshots inside docs/design-resources. It needs network access, verifies cached files too, and does not launch upstream software. Updating to new commits is an explicit maintenance change; do not silently replace pinned references during implementation.
