"""Fetch pinned, selected design resources without running upstream installers.

Run from the repository root: py -3 docs/tools/load_design_resources.py
Only writes inside docs/design-resources. No packages or services are installed.
"""

import concurrent.futures
import hashlib
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / "design-resources"
SOURCES = [
    {
        "name": "open-design",
        "repo": "nexu-io/open-design",
        "commit": "53231d40b778d88eba23f35547bf99485d3ae9fc",
        "license": "Apache-2.0",
        "prefixes": ["skills/frontend-design/", "skills/web-design-guidelines/"],
        "files": [
            "README.md", "LICENSE", "AGENTS.md",
            "design-systems/figma/DESIGN.md", "design-systems/figma/USAGE.md",
            "design-systems/figma/tokens.css", "design-systems/figma/manifest.json",
            "design-systems/notion/DESIGN.md", "design-systems/notion/USAGE.md",
            "design-systems/notion/tokens.css", "design-systems/notion/manifest.json",
        ],
    },
    {
        "name": "hallmark",
        "repo": "nutlope/hallmark",
        "commit": "13ac0ec7e148655948100b6396439e481361d690",
        "license": "MIT",
        "prefixes": ["skills/hallmark/", "site/css/"],
        "files": ["README.md", "LICENSE"],
    },
    {
        "name": "ui-ux-pro-max",
        "repo": "nextlevelbuilder/ui-ux-pro-max-skill",
        "commit": "477bcb28c9812b385cb51a4605ddf30d7b2266e2",
        "license": "MIT",
        "prefixes": [".claude/skills/ui-ux-pro-max/"],
        "files": ["README.md", "LICENSE"],
    },
]


def fetch(url):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "CreatorAi-research"})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def download(source, entry):
    relative = entry["path"]
    destination = ROOT / source["name"] / relative
    destination.resolve().relative_to(ROOT.resolve())
    if destination.exists():
        data = destination.read_bytes()
    else:
        data = fetch(f'https://raw.githubusercontent.com/{source["repo"]}/{source["commit"]}/{relative}')
    # Verify against the pinned Git object, including cached files.
    git_blob = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    if git_blob != entry["sha"]:
        raise ValueError(f"Upstream blob verification failed: {relative}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return {"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {"research_date": "2026-10-04", "scope": "selected upstream resources; not full applications", "sources": []}
    for source in SOURCES:
        tree = json.loads(fetch(f'https://api.github.com/repos/{source["repo"]}/git/trees/{source["commit"]}?recursive=1'))
        if tree.get("truncated"):
            raise ValueError("GitHub returned an incomplete source tree")
        entries = [entry for entry in tree["tree"] if entry["type"] == "blob" and
                   (entry["path"] in source["files"] or any(entry["path"].startswith(p) for p in source["prefixes"]))]
        available = {entry["path"] for entry in entries}
        missing = set(source["files"]) - available
        if missing:
            raise ValueError(f"Missing requested resources: {sorted(missing)}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            files = list(executor.map(lambda entry: download(source, entry), entries))
        manifest["sources"].append({**source, "downloaded_files": sorted(files, key=lambda item: item["path"])})
        print(f'{source["name"]}: {len(files)} files, {sum(item["bytes"] for item in files):,} bytes; blobs verified')
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
