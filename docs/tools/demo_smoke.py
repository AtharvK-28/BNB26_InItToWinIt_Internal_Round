"""Explicit, low-volume demo checks. Nothing submits AI jobs on a status/verify call."""

import argparse
import io
import json
import sys
import time
import zipfile
from pathlib import Path
from uuid import uuid4

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/api"))
from creatorai.config import Settings

ACCOUNTS = ROOT / ".local/cloud-smoke.json"
STATE = ROOT / ".local/demo-smoke.json"


def main(action):
    settings = Settings()
    credentials = json.loads(ACCOUNTS.read_text())["users"]
    public = dotenv_values(ROOT / "apps/web/.env.local")[
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    ]
    tokens = []
    with httpx.Client(timeout=30) as auth:
        for user in credentials:
            response = auth.post(
                settings.supabase_url + "/auth/v1/token?grant_type=password",
                headers={"apikey": public},
                json={"email": user["email"], "password": user["password"]},
            )
            response.raise_for_status()
            tokens.append(response.json()["access_token"])
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    with httpx.Client(
        base_url="http://127.0.0.1:8000",
        timeout=90,
        headers={"Authorization": "Bearer " + tokens[0]},
    ) as api:

        def post(path, body):
            response = api.post(path, json=body)
            response.raise_for_status()
            return response.json()

        if action == "setup":
            if state.get("project"):
                print("Existing demo check preserved.")
                return
            project = post(
                "/projects",
                {
                    "title": "Demo / source to story",
                    "brief": "Find one useful, self-contained takeaway from the spoken footage. "
                    "Keep the creator's words and match the visual evidence.",
                    "platforms": ["youtube", "instagram"],
                },
            )
            source = ROOT / ".local/demo-input.mp4"
            if not source.exists():
                source = ROOT / ".local/deno-input.mp4"
            with source.open("rb") as file:
                response = api.post(
                    f"/projects/{project['id']}/assets",
                    files={"file": ("demo-input.mp4", file, "video/mp4")},
                )
            response.raise_for_status()
            state.update(project=project["id"], asset=response.json()["id"])
            print(
                "Actual demo footage imported into the disposable verification project."
            )
        elif action in {"analyze", "clips", "story", "export"}:
            fields = {}
            if action in {"analyze", "clips"}:
                fields = {
                    "asset_id": state["asset"],
                    "instruction": "Propose one strong clip, "
                    "15–35 seconds if the material supports it. Inspect just one candidate window.",
                }
            if action == "story":
                evidence = api.get(f"/assets/{state['asset']}/analysis").json()["data"]
                project = api.get(f"/projects/{state['project']}").json()
                response = api.put(
                    f"/projects/{state['project']}",
                    json={
                        "title": project["title"],
                        "platforms": project["platforms"],
                        "brief": evidence["summary"]
                        + "\n\n"
                        + " ".join(s["text"] for s in evidence["transcript"])[:6000],
                        "revision": project["revision"],
                    },
                )
                response.raise_for_status()
                fields = {
                    "instruction": "Use the saved source transcript for facts. "
                    "Write a short, faithful script, three hooks and two titles."
                }
            if action == "export":
                cuts = api.get(f"/projects/{state['project']}/clips").json()
                assert cuts
                fields = {
                    "clip_id": cuts[0]["id"],
                    "clip_revision": cuts[0]["revision"],
                    "preset": "instagram_reel",
                }
            run = post(
                f"/projects/{state['project']}/runs",
                {"request_id": str(uuid4()), "kind": action, **fields},
            )
            state["run"] = run["id"]
            print(f"One explicit {action} task queued. No automatic retries.")
        elif action == "retry":
            post(f"/runs/{state['run']}/retry", {})
            print("One explicit retry queued for the media fix.")
        elif action == "approve":
            post(f"/runs/{state['run']}/decision", {"action": "approve"})
            print(
                "Creator review approved for the verification sample; no AI call required."
            )
        elif action == "status":
            deadline = time.monotonic() + 40
            while True:
                result = api.get(f"/runs/{state['run']}").json()
                if (
                    result["status"] not in {"queued", "running"}
                    or time.monotonic() > deadline
                ):
                    print(
                        json.dumps(
                            {
                                key: result[key]
                                for key in ["kind", "status", "stage", "error"]
                            }
                            | {"usage": result["output"].get("_usage")}
                        )
                    )
                    break
                time.sleep(2)
        elif action == "verify":
            pid, aid = state["project"], state["asset"]
            index = api.get(f"/assets/{aid}/analysis").json()
            assert index["ready"] and index["data"]["transcript"]
            cuts = api.get(f"/projects/{pid}/clips").json()
            assert cuts
            exports = api.get(f"/projects/{pid}/exports").json()
            assert exports
            links = api.get(f"/exports/{exports[0]['id']}/links").json()
            with httpx.Client(timeout=60) as media:
                response = media.get(links["package"])
                response.raise_for_status()
                package = response.content
                assert media.get(links["video"].split("?")[0]).status_code in (
                    400,
                    401,
                    403,
                )
            with zipfile.ZipFile(io.BytesIO(package)) as archive:
                assert {
                    "video.mp4",
                    "edit-plan.json",
                    "cover.svg",
                    "captions.srt",
                    "caption.txt",
                }.issubset(archive.namelist())
            (ROOT / ".local/demo-editable.zip").write_bytes(package)
            bob = {"Authorization": "Bearer " + tokens[1]}
            for path in [
                f"/projects/{pid}/runs",
                f"/projects/{pid}/clips",
                f"/assets/{aid}/analysis",
                f"/exports/{exports[0]['id']}/links",
            ]:
                assert api.get(path, headers=bob).status_code == 404
            print(
                "Real source analysis, agent proposals, review, private export package and account isolation passed."
            )
        STATE.write_text(json.dumps(state), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "action",
        choices=[
            "setup",
            "analyze",
            "clips",
            "story",
            "approve",
            "export",
            "status",
            "verify",
            "retry",
        ],
    )
    try:
        main(parser.parse_args().action)
    except Exception as error:  # noqa: BLE001 -- never reveal provider/auth/connection data
        print(
            f"Demo check failed ({type(error).__name__}); credentials were not displayed."
        )
        sys.exit(1)
