"""Verify pinned resources offline; optionally install them for this project."""

import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESOURCES = ROOT / "docs/design-resources"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--install", action="store_true", help="Copy to ignored .agents/skills"
    )
    args = parser.parse_args()
    manifest = json.loads((RESOURCES / "manifest.json").read_text(encoding="utf-8"))
    total = 0
    for source in manifest["sources"]:
        for entry in source["downloaded_files"]:
            file = RESOURCES / source["name"] / entry["path"]
            file.resolve().relative_to(RESOURCES.resolve())
            if hashlib.sha256(file.read_bytes()).hexdigest() != entry["sha256"]:
                raise ValueError(
                    f"Resource checksum mismatch: {file.relative_to(RESOURCES)}"
                )
            total += 1
    print(f"Verified {total} pinned design resource files offline.")
    if not args.install:
        return
    copies = {
        "frontend-design": RESOURCES / "open-design/skills/frontend-design",
        "hallmark": RESOURCES / "hallmark/skills/hallmark",
        "ui-ux-pro-max": RESOURCES / "ui-ux-pro-max/.claude/skills/ui-ux-pro-max",
    }
    for name, source in copies.items():
        target = ROOT / ".agents/skills" / name
        target.resolve().relative_to(ROOT.resolve())
        if target.exists():
            print(f"Kept existing {name}; no files overwritten.")
            continue
        shutil.copytree(source, target)
        license_file = (
            RESOURCES
            / ("open-design" if name == "frontend-design" else name)
            / "LICENSE"
        )
        if license_file.is_file() and not (target / "LICENSE").exists():
            shutil.copyfile(license_file, target / "LICENSE")
        print(f"Installed project skill: {name}")
    print(
        "Restart your coding agent to discover skills. Read DESIGN.md before applying them."
    )
    print(
        "Hallmark site CSS references remain in docs/design-resources/hallmark/site/css."
    )


if __name__ == "__main__":
    main()
