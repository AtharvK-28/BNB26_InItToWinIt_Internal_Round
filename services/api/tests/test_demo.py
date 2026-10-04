"""Core workflow checks use real FFmpeg and durable graphs, with no provider requests."""

import io
import json
import shutil
import subprocess
import zipfile
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from creatorai.ai import ProviderError
from creatorai.auth import get_owner
from creatorai.config import Settings
from creatorai.database import Analysis
from creatorai.demo_schemas import Understanding, now
from creatorai.main import create_app

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def setup(tmp_path):
    ffmpeg = shutil.which("ffmpeg") or str(ROOT / ".local/tools/ffmpeg.exe")
    ffprobe = shutil.which("ffprobe") or str(ROOT / ".local/tools/ffprobe.exe")
    if not Path(ffmpeg).is_file():
        pytest.skip("FFmpeg required")
    settings = Settings(
        _env_file=None,
        data_dir=tmp_path,
        ffmpeg_binary=ffmpeg,
        ffprobe_binary=ffprobe,
        gemini_api_key=SecretStr("mock-only"),
    )
    source = tmp_path / "fixture.mp4"
    subprocess.run(
        [
            ffmpeg,
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=12",
            "-t",
            "2",
            "-c:v",
            "libx264",
            "-threads",
            "1",
            "-pix_fmt",
            "yuv420p",
            str(source),
        ],
        check=True,
        timeout=20,
    )
    app = create_app(settings=settings)
    with TestClient(app) as client:
        project = client.post(
            "/projects",
            json={
                "title": "A useful moment",
                "brief": "Show color",
                "platforms": ["youtube", "instagram"],
            },
        ).json()
        asset = client.post(
            f"/projects/{project['id']}/assets",
            files={"file": ("fixture.mp4", source.read_bytes())},
        ).json()
        yield app, client, project, asset


class MockAI:
    def __init__(self):
        self.calls = 0
        self.analysis_calls = 0

    def structured(self, parts, model, system):
        self.analysis_calls += 1
        assert model is Understanding
        return Understanding(
            summary="A moving synthetic color chart",
            language="none",
            transcript=[],
            visuals=[{"time": 0, "description": "A synthetic chart"}],
            notes="Silent fixture",
        )

    def generate(self, messages, *, system="", tools=None):
        if not tools:
            return {"role": "model", "parts": [{"text": "Synthetic color chart visible."}]}
        # Drive the tool protocol by its durable conversation rather than process-local state.
        replies = [
            part["functionResponse"]["name"]
            for message in messages
            for part in message["parts"]
            if "functionResponse" in part
        ]
        order = ["read_script", "search_transcript", "inspect_window", "propose_clip_plan"]
        name = next((name for name in order if name not in replies), "propose_clip_plan")
        arguments = {
            "read_script": {},
            "search_transcript": {"query": "color"},
            "inspect_window": {"start": 0, "end": 1.5, "question": "What is visible?"},
            "propose_clip_plan": {
                "clips": [
                    {
                        "title": "Color in motion",
                        "hook": "Watch this",
                        "start": 0.2,
                        "end": 1.5,
                        "rationale": "Visible moving chart",
                        "source_quote": "",
                        "script_match": "Matches the color brief",
                        "caption": "Color study",
                    }
                ],
                "coverage_notes": "Visual-only fixture; no invented speech.",
            },
        }[name]
        self.calls += 1
        return {
            "role": "model",
            "parts": [
                {
                    "functionCall": {"name": name, "args": arguments, "id": "test-call"},
                    "thoughtSignature": "test-signature",
                }
            ],
        }


def start(client, pid, kind, **fields):
    result = client.post(
        f"/projects/{pid}/runs", json={"kind": kind, "request_id": str(uuid4()), **fields}
    )
    assert result.status_code == 202, result.text
    return result.json()


def test_agent_review_survives_restart_without_reanalysis(setup):
    app, client, project, asset = setup
    fake = MockAI()
    app.state.jobs.ai = fake
    run = start(client, project["id"], "clips", asset_id=asset["id"])
    assert app.state.jobs.process_next()
    review = client.get(f"/runs/{run['id']}").json()
    assert review["status"] == "review", review
    assert fake.calls == 4 and fake.analysis_calls == 1
    cuts = client.get(f"/projects/{project['id']}/clips").json()
    assert len(cuts) == 1
    assert client.get(f"/assets/{asset['id']}/analysis").json()["ready"]
    # A separate app/process reopens the SQLite saver and resumes the human interrupt.
    restarted = create_app(settings=app.state.settings)
    with TestClient(restarted) as again:
        restarted.state.jobs.ai = fake
        result = again.post(f"/runs/{run['id']}/decision", json={"action": "approve"})
        assert result.status_code == 200
        assert restarted.state.jobs.process_next()
        final = again.get(f"/runs/{run['id']}").json()
        assert final["status"] == "completed", final
        assert fake.calls == 4 and fake.analysis_calls == 1
        assert len(again.get(f"/projects/{project['id']}/clips").json()) == 1


def test_edit_render_package_and_account_isolation(setup):
    app, client, project, asset = setup
    owner = str(uuid4())
    # Existing local rows belong to LOCAL_OWNER; authenticate a different account later.
    result = client.post(
        f"/projects/{project['id']}/clips",
        json={"request_id": str(uuid4()), "asset_id": asset["id"]},
    )
    assert result.status_code == 201
    clip = result.json()
    clip["document"].update(
        start=0.25,
        end=1.75,
        caption="An actual rendered fixture",
        subtitle_segments=[{"start": 0.25, "end": 1.5, "text": "Editable captions"}],
    )
    edited = client.put(f"/clips/{clip['id']}", json={"revision": 1, "document": clip["document"]})
    assert edited.status_code == 200
    assert (
        client.put(
            f"/clips/{clip['id']}", json={"revision": 1, "document": clip["document"]}
        ).status_code
        == 409
    )
    run = start(
        client,
        project["id"],
        "export",
        clip_id=clip["id"],
        clip_revision=2,
        preset="instagram_reel",
    )
    assert app.state.jobs.process_next()
    completed = client.get(f"/runs/{run['id']}").json()
    assert completed["status"] == "completed", completed
    exports = client.get(f"/projects/{project['id']}/exports").json()
    assert len(exports) == 1 and exports[0]["clip_revision"] == 2
    links = client.get(f"/exports/{exports[0]['id']}/links").json()
    video = client.get(links["video"])
    assert video.status_code == 200 and video.headers["content-type"] == "video/mp4"
    rendered = app.state.settings.data_dir / "render-check.mp4"
    rendered.write_bytes(video.content)
    probe = subprocess.run(
        [
            app.state.settings.ffprobe_binary,
            "-v",
            "error",
            "-show_streams",
            "-of",
            "json",
            str(rendered),
        ],
        capture_output=True,
        check=True,
    )
    stream = json.loads(probe.stdout)["streams"][0]
    assert (stream["width"], stream["height"]) == (720, 1280)
    assert 1.4 <= float(stream["duration"]) <= 1.6
    with zipfile.ZipFile(io.BytesIO(client.get(links["package"]).content)) as package:
        plan = json.loads(package.read("edit-plan.json"))
        assert plan["document"]["start"] == 0.25
        assert package.read("caption.txt").decode() == "An actual rendered fixture"
        assert b"title-layer" in package.read("cover.svg")
        assert b"Editable captions" in package.read("captions.srt")
    app.dependency_overrides[get_owner] = lambda: owner
    for path in [
        f"/projects/{project['id']}/runs",
        f"/runs/{run['id']}",
        f"/projects/{project['id']}/clips",
        f"/assets/{asset['id']}/analysis",
        f"/projects/{project['id']}/exports",
        f"/exports/{exports[0]['id']}/links",
    ]:
        assert client.get(path).status_code == 404
    assert (
        client.put(
            f"/clips/{clip['id']}", json={"revision": 2, "document": clip["document"]}
        ).status_code
        == 404
    )
    assert client.post(f"/runs/{run['id']}/retry").status_code == 404


def test_requests_are_idempotent_and_cancelled_jobs_do_not_run(setup):
    app, client, project, _ = setup
    payload = {"kind": "story", "request_id": str(uuid4())}
    first = client.post(f"/projects/{project['id']}/runs", json=payload)
    second = client.post(f"/projects/{project['id']}/runs", json=payload)
    assert first.json()["id"] == second.json()["id"]
    assert (
        client.post(
            f"/projects/{project['id']}/runs", json={**payload, "instruction": "different"}
        ).status_code
        == 409
    )
    assert client.post(f"/runs/{first.json()['id']}/cancel").status_code == 200
    assert not app.state.jobs.process_next()


def test_failed_provider_is_explicit_and_cached_index_is_reused(setup):
    app, client, project, asset = setup
    fake = MockAI()
    app.state.jobs.ai = fake
    with app.state.sessions() as session:
        session.add(
            Analysis(
                asset_id=asset["id"],
                project_id=project["id"],
                owner_id=__import__("creatorai.config", fromlist=["LOCAL_OWNER"]).LOCAL_OWNER,
                pipeline="audio-frames-v1:" + app.state.settings.gemini_model,
                data={"summary": "Existing index", "transcript": [], "visuals": []},
                created_at=now(),
            )
        )
        session.commit()
    run = start(client, project["id"], "analyze", asset_id=asset["id"])
    app.state.jobs.process_next()
    assert client.get(f"/runs/{run['id']}").json()["status"] == "completed"
    assert fake.analysis_calls == 0

    def unavailable(*args, **kwargs):
        raise ProviderError("Free quota exhausted. Retry later.")

    fake.structured = unavailable
    failed = start(client, project["id"], "story")
    app.state.jobs.process_next()
    result = client.get(f"/runs/{failed['id']}").json()
    assert result["status"] == "failed" and "quota" in result["error"]
    assert result["output"] == {}
