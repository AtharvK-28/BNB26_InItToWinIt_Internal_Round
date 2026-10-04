"""Real Supabase checks with disposable accounts, no email delivery or secret output.

Run prepare, exercise the browser, run verify, sign out, then run cleanup.
Only the generated account IDs and their project/media rows are removed.
"""

import argparse
import json
import secrets
import sys
from pathlib import Path
from uuid import uuid4

import httpx
from sqlalchemy import delete, select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/api"))
from creatorai.agent import checkpoints
from creatorai.config import Settings
from creatorai.database import Asset, Export, Project, Run, make_database
from creatorai.storage import make_storage

STATE = ROOT / ".local/cloud-smoke.json"


def prepare(settings):
    if STATE.exists():
        print(
            "Existing verification accounts preserved; clean them before another preparation."
        )
        return
    key = settings.supabase_service_role_key.get_secret_value()
    with httpx.Client(
        base_url=settings.supabase_url,
        timeout=30,
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    ) as client:
        bucket = client.get(f"/storage/v1/bucket/{settings.storage_bucket}")
        if bucket.status_code == 404 or (
            bucket.status_code == 400 and "not found" in bucket.text.lower()
        ):
            bucket = client.post(
                "/storage/v1/bucket",
                json={
                    "id": settings.storage_bucket,
                    "name": settings.storage_bucket,
                    "public": False,
                    "file_size_limit": 40 * 1024 * 1024,
                    "allowed_mime_types": [
                        "video/mp4",
                        "video/webm",
                        "video/quicktime",
                        "image/jpeg",
                        "application/zip",
                    ],
                },
            )
            bucket.raise_for_status()
            bucket = client.get(f"/storage/v1/bucket/{settings.storage_bucket}")
        bucket.raise_for_status()
        if bucket.json().get("public"):
            raise ValueError("The media bucket must be private.")
        mime_types = bucket.json().get("allowed_mime_types")
        if mime_types is not None and "application/zip" not in mime_types:
            client.put(
                f"/storage/v1/bucket/{settings.storage_bucket}",
                json={
                    "public": False,
                    "file_size_limit": 40 * 1024 * 1024,
                    "allowed_mime_types": [*mime_types, "application/zip"],
                },
            ).raise_for_status()
        jwks = client.get("/auth/v1/.well-known/jwks.json")
        jwks.raise_for_status()
        if not jwks.json().get("keys"):
            raise ValueError(
                "Enable an asymmetric Supabase JWT signing key before testing."
            )
        state = {"users": []}
        for index in range(2):
            email = f"creatorai-check-{uuid4().hex}@example.com"
            password = secrets.token_urlsafe(24)
            response = client.post(
                "/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"creatorai_verification": True},
                },
            )
            response.raise_for_status()
            user = response.json()
            state["users"].append(
                {"id": user["id"], "email": email, "password": password}
            )
            STATE.parent.mkdir(parents=True, exist_ok=True)
            STATE.write_text(json.dumps(state), encoding="utf-8")
        print(
            "Private bucket and public JWT keys verified. Two temporary verification accounts prepared; no emails sent."
        )


def verify(settings):
    state = json.loads(STATE.read_text(encoding="utf-8"))
    tokens = []
    public_key = __import__("dotenv").dotenv_values(ROOT / "apps/web/.env.local")[
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    ]
    with httpx.Client(
        base_url=settings.supabase_url, timeout=30, headers={"apikey": public_key}
    ) as client:
        for user in state["users"]:
            response = client.post(
                "/auth/v1/token?grant_type=password",
                json={"email": user["email"], "password": user["password"]},
            )
            response.raise_for_status()
            tokens.append(response.json()["access_token"])
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=90) as api:
        assert api.get("/health").json()["mode"] == "cloud"
        assert api.get("/projects").status_code == 401
        alice = {"Authorization": f"Bearer {tokens[0]}"}
        bob = {"Authorization": f"Bearer {tokens[1]}"}
        response = api.get("/projects", headers=alice)
        response.raise_for_status()
        projects = response.json()
        if projects:
            project = projects[0]
        else:
            response = api.post(
                "/projects",
                headers=alice,
                json={
                    "title": "Verification sample",
                    "brief": "Disposable connection check",
                    "platforms": ["youtube", "instagram"],
                },
            )
            response.raise_for_status()
            project = response.json()
        pid = project["id"]
        response = api.get(f"/projects/{pid}", headers=alice)
        response.raise_for_status()
        assert api.get(f"/projects/{pid}", headers=bob).status_code == 404
        assert api.get(f"/projects/{pid}/assets", headers=bob).status_code == 404
        with (ROOT / ".local/verification.mp4").open("rb") as file:
            response = api.post(
                f"/projects/{pid}/assets",
                headers=alice,
                files={"file": ("verification.mp4", file, "video/mp4")},
            )
        response.raise_for_status()
        asset = response.json()
        assert api.get(f"/assets/{asset['id']}/links", headers=bob).status_code == 404
        response = api.get(f"/assets/{asset['id']}/links", headers=alice)
        response.raise_for_status()
        links = response.json()
        with httpx.Client(timeout=30) as media:
            original = media.get(links["original"])
            original.raise_for_status()
            assert original.content == (ROOT / ".local/verification.mp4").read_bytes()
            assert (
                media.get(links["thumbnail"])
                .headers["content-type"]
                .startswith("image/jpeg")
            )
            assert media.get(links["original"].split("?")[0]).status_code in (
                400,
                401,
                403,
            )
        print(
            "Live cloud verification passed: genuine JWTs, Postgres persistence, account isolation, private originals/thumbnails and signed playback links."
        )


def cleanup(settings):
    state = json.loads(STATE.read_text(encoding="utf-8"))
    engine, sessions = make_database(settings.sql_url)
    storage = make_storage(settings)
    key = settings.supabase_service_role_key.get_secret_value()
    try:
        with httpx.Client(
            base_url=settings.supabase_url,
            timeout=30,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        ) as auth:
            for user in state["users"]:
                response = auth.get(f"/auth/v1/admin/users/{user['id']}")
                if response.status_code == 200:
                    assert (
                        response.json()
                        .get("user_metadata", {})
                        .get("creatorai_verification")
                        is True
                    )
                elif response.status_code != 404:
                    response.raise_for_status()
                with sessions() as session:
                    export_rows = session.scalars(
                        select(Export).where(Export.owner_id == user["id"])
                    ).all()
                    for row in export_rows:
                        storage.delete(row.video_key)
                        storage.delete(row.package_key)
                    run_ids = session.scalars(
                        select(Run.id).where(Run.owner_id == user["id"])
                    ).all()
                    with checkpoints(settings) as saver:
                        for run_id in run_ids:
                            saver.delete_thread(run_id)
                    assets = session.scalars(
                        select(Asset).where(Asset.owner_id == user["id"])
                    ).all()
                    for asset in assets:
                        storage.delete(asset.original_key)
                        storage.delete(asset.thumbnail_key)
                    session.execute(delete(Asset).where(Asset.owner_id == user["id"]))
                    session.execute(
                        delete(Project).where(Project.owner_id == user["id"])
                    )
                    session.commit()
                response = auth.delete(f"/auth/v1/admin/users/{user['id']}")
                if response.status_code != 404:
                    response.raise_for_status()
        STATE.unlink()
        print(
            "Temporary verification accounts, their projects/media and local credentials removed."
        )
    finally:
        engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "verify", "cleanup"])
    action = parser.parse_args().action
    try:
        globals()[action](Settings())
    except Exception as error:  # noqa: BLE001 -- never print driver/HTTP errors with secrets
        print(f"Cloud check failed ({type(error).__name__}); no credentials displayed.")
        sys.exit(1)
