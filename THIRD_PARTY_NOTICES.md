# Bundled design resources

The selected upstream resource snapshots under `docs/design-resources/` are development references, not runtime services. Keep their license files and attribution with redistributed copies. Individual upstream files may carry additional notices; those are preserved in the snapshot.

| Source | Pinned commit | Included license |
| --- | --- | --- |
| [OpenDesign](https://github.com/nexu-io/open-design) | `53231d40b778d88eba23f35547bf99485d3ae9fc` | Apache-2.0, including the frontend skill's own LICENSE.txt |
| [Hallmark](https://github.com/nutlope/hallmark) | `13ac0ec7e148655948100b6396439e481361d690` | MIT |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `477bcb28c9812b385cb51a4605ddf30d7b2266e2` | MIT |

These licenses allow redistribution under their conditions, so these snapshots can be checked into GitHub with the notices intact. Brand references are examples; their presence does not grant trademark rights. No third-party brand screenshots or logos have been incorporated into the application.

Frontend dependencies are recorded in `pnpm-lock.yaml`; Python dependencies are in `services/api/uv.lock` and the generated requirements file. Local Windows FFmpeg executables remain ignored. The API Docker image installs Debian's FFmpeg package; distribute an image with the package's license/copyright notices intact.
