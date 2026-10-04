import shutil
import sqlite3
import subprocess
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException
from fastapi.testclient import TestClient

from creatorai.auth import TokenVerifier, get_owner
from creatorai.config import LOCAL_OWNER, Settings
from creatorai.database import Asset
from creatorai.main import create_app
from creatorai.migrate import upgrade_database

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="module")
def tools():
    ffmpeg = shutil.which("ffmpeg") or str(ROOT / ".local/tools/ffmpeg.exe")
    ffprobe = shutil.which("ffprobe") or str(ROOT / ".local/tools/ffprobe.exe")
    if not Path(ffmpeg).is_file() or not Path(ffprobe).is_file():
        pytest.skip("Install FFmpeg/ffprobe to run real media integration checks")
    return ffmpeg, ffprobe


@pytest.fixture(scope="module")
def clip(tmp_path_factory, tools):
    path = tmp_path_factory.mktemp("media") / "verification.mp4"
    subprocess.run(
        [
            tools[0],
            "-nostdin",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=12",
            "-t",
            "1.5",
            "-c:v",
            "libx264",
            "-threads",
            "1",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(path),
        ],
        check=True,
        timeout=30,
    )
    return path.read_bytes()


@pytest.fixture
def media_app(tmp_path, tools):
    settings = Settings(
        _env_file=None,
        app_mode="local",
        database_url="",
        data_dir=tmp_path,
        storage_backend="local",
        ffmpeg_binary=tools[0],
        ffprobe_binary=tools[1],
        max_upload_mb=1,
    )
    return create_app(settings=settings)


def project(client):
    return client.post("/projects", json={"title": "Media check", "platforms": ["youtube"]}).json()[
        "id"
    ]


def test_media_survives_restart_and_duplicates_are_reused(media_app, clip):
    with TestClient(media_app) as client:
        pid = project(client)
        asset = client.post(
            f"/projects/{pid}/assets", files={"file": ("clip.mp4", clip, "video/mp4")}
        )
        assert asset.status_code == 201
        aid = asset.json()["id"]
        assert asset.json()["width"] == 320 and asset.json()["duration"] > 1
        duplicate = client.post(f"/projects/{pid}/assets", files={"file": ("renamed.mp4", clip)})
        assert duplicate.json()["id"] == aid
        links = client.get(f"/assets/{aid}/links").json()
        original = client.get(links["original"])
        assert original.content == clip
        partial = client.get(links["original"], headers={"range": "bytes=0-15"})
        assert partial.status_code == 206 and partial.content == clip[:16]
        assert client.get(links["thumbnail"]).headers["content-type"] == "image/jpeg"
        assert (
            client.get(links["original"].replace("signature=", "signature=invalid")).status_code
            == 403
        )
        with media_app.state.sessions() as session:
            key = session.get(Asset, aid).original_key
        with pytest.raises(FileExistsError):
            media_app.state.storage.put(key, media_app.state.storage.path(key), "video/mp4")
    with TestClient(media_app) as client:
        assert len(client.get(f"/projects/{pid}/assets").json()) == 1
        assert client.get(client.get(f"/assets/{aid}/links").json()["original"]).content == clip


def test_cross_account_projects_and_media_are_hidden(media_app, clip):
    alice, bob = str(uuid4()), str(uuid4())
    media_app.dependency_overrides[get_owner] = lambda: alice
    with TestClient(media_app) as client:
        pid = project(client)
        aid = client.post(f"/projects/{pid}/assets", files={"file": ("clip.mp4", clip)}).json()[
            "id"
        ]
        media_app.dependency_overrides[get_owner] = lambda: bob
        assert client.get("/projects").json() == []
        for route in (f"/projects/{pid}", f"/projects/{pid}/assets", f"/assets/{aid}/links"):
            assert client.get(route).status_code == 404
        assert (
            client.put(
                f"/projects/{pid}",
                json={"title": "Overwrite", "platforms": ["youtube"], "revision": 1},
            ).status_code
            == 404
        )
        assert (
            client.post(f"/projects/{pid}/assets", files={"file": ("clip.mp4", clip)}).status_code
            == 404
        )


def test_invalid_oversized_and_chunked_uploads_leave_no_assets(media_app, clip):
    with TestClient(media_app) as client:
        pid = project(client)
        for filename, data, status in (
            ("empty.mp4", b"", 422),
            ("broken.mp4", b"not video", 422),
            ("too-large.mp4", b"x" * (1024 * 1024 + 1), 413),
            ("script.svg", clip, 422),
        ):
            assert (
                client.post(f"/projects/{pid}/assets", files={"file": (filename, data)}).status_code
                == status
            )
        boundary = (
            b'--check\r\nContent-Disposition: form-data; name="file"; filename="clip.mp4"\r\n'
            b"Content-Type: video/mp4\r\n\r\n"
        )
        body = iter([boundary, b"x" * (3 * 1024 * 1024), b"\r\n--check--\r\n"])
        response = client.post(
            f"/projects/{pid}/assets",
            content=body,
            headers={"Content-Type": "multipart/form-data; boundary=check"},
        )
        assert response.status_code == 413
        assert client.get(f"/projects/{pid}/assets").json() == []
        assert not list(media_app.state.settings.data_dir.glob("creatorai-*"))


def test_failed_storage_cleans_objects_and_database(media_app, clip, monkeypatch):
    with TestClient(media_app) as client:
        pid = project(client)
        storage = media_app.state.storage
        put = storage.put

        def fail_thumbnail(key, source, content_type):
            if key.endswith("thumbnail.jpg"):
                raise OSError("Simulated disk full")
            put(key, source, content_type)

        monkeypatch.setattr(storage, "put", fail_thumbnail)
        assert (
            client.post(f"/projects/{pid}/assets", files={"file": ("clip.mp4", clip)}).status_code
            == 503
        )
        assert client.get(f"/projects/{pid}/assets").json() == []
        assert not list(storage.root.rglob("*.mp4"))


def test_existing_sqlite_drafts_are_backed_up_and_migrated(tmp_path):
    path = tmp_path / "creatorai.db"
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE projects (id TEXT PRIMARY KEY,title TEXT NOT NULL,brief TEXT NOT NULL,"
            "platforms JSON NOT NULL,revision INTEGER NOT NULL,created_at DATETIME NOT NULL,"
            "updated_at DATETIME NOT NULL)"
        )
        connection.execute(
            "INSERT INTO projects VALUES "
            "('old','Existing draft','Keep me','[\"youtube\"]',3,'2026-10-04','2026-10-04')"
        )
    url = f"sqlite:///{path.as_posix()}"
    upgrade_database(url, tmp_path)
    with sqlite3.connect(path) as connection:
        row = connection.execute("SELECT brief,revision,owner_id FROM projects").fetchone()
        assert row == ("Keep me", 3, LOCAL_OWNER)
        assert connection.execute("SELECT version_num FROM alembic_version").fetchone()[0] == "0003"
    backup = next(tmp_path.glob("creatorai-before-migration-*.db"))
    with sqlite3.connect(backup) as connection:
        assert len(connection.execute("PRAGMA table_info(projects)").fetchall()) == 7
    upgrade_database(url, tmp_path)
    assert len(list(tmp_path.glob("creatorai-before-migration-*.db"))) == 1


@pytest.mark.parametrize(
    "change",
    [
        None,
        {"exp": 1},
        {"aud": "wrong"},
        {"iss": "https://wrong"},
        {"sub": "bad"},
        {"role": "anon"},
    ],
)
def test_real_signed_jwt_claims_are_verified(change, monkeypatch):
    import time

    key = ec.generate_private_key(ec.SECP256R1())
    verifier = TokenVerifier(Settings(_env_file=None, supabase_url="https://check.supabase.co"))
    monkeypatch.setattr(
        verifier.keys, "get_signing_key_from_jwt", lambda _: SimpleNamespace(key=key.public_key())
    )
    owner = str(uuid4())
    claims = {
        "sub": owner,
        "iss": verifier.issuer,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": int(time.time()) + 300,
        **(change or {}),
    }
    token = jwt.encode(claims, key, algorithm="ES256", headers={"kid": "check"})
    if change:
        with pytest.raises(HTTPException) as failure:
            verifier.verify(token)
        assert failure.value.status_code == 401
    else:
        assert verifier.verify(token) == owner


def test_raw_database_password_and_hosted_guards():
    settings = Settings(
        _env_file=None,
        app_mode="cloud",
        database_url="postgresql://postgres.ref:[YOUR-PASSWORD]@example.com:5432/postgres",
        database_password="raw:@#/? password",
        storage_backend="supabase",
        supabase_url="https://check.supabase.co",
        supabase_service_role_key="test-only",
    )
    assert settings.sql_url.password == "raw:@#/? password"
    assert settings.sql_url.query["sslmode"] == "require"
    with pytest.raises(ValueError):
        Settings(_env_file=None, app_mode="cloud", database_url="sqlite:///test.db")
    with pytest.raises(ValueError):
        Settings(_env_file=None, allowed_hosts="*")


def test_images_audio_and_documents_are_stored_with_previews(media_app, tools, tmp_path):
    def make(name, *args):
        path = tmp_path / name
        subprocess.run([tools[0], "-v", "error", "-y", *args, str(path)], check=True, timeout=30)
        return path.read_bytes()

    color = ["-f", "lavfi", "-i", "testsrc2=size=320x180", "-frames:v", "1"]
    files = {
        "still.png": (make("still.png", *color), "image", "image/png"),
        "photo.jpg": (make("photo.jpg", *color), "image", "image/jpeg"),
        "voice.m4a": (
            make("voice.m4a", "-f", "lavfi", "-i", "sine=d=1.5", "-c:a", "aac"),
            "audio",
            "audio/mp4",
        ),
        "bed.wav": (make("bed.wav", "-f", "lavfi", "-i", "sine=d=1"), "audio", "audio/wav"),
        "brief.md": (b"# Brief\nShow the desk, then the cable tray.", "document", "text/plain"),
        "brand.pdf": (b"%PDF-1.4\n%%EOF\n", "document", "application/pdf"),
    }
    with TestClient(media_app) as client:
        pid = project(client)
        for name, (data, kind, content_type) in files.items():
            result = client.post(f"/projects/{pid}/assets", files={"file": (name, data)})
            assert result.status_code == 201, (name, result.text)
            asset = result.json()
            assert asset["kind"] == kind and asset["content_type"].startswith(content_type), name
            if kind == "audio":
                assert 0.9 <= asset["duration"] <= 1.6
            if kind == "image":
                assert (asset["width"], asset["height"]) == (320, 180)
            links = client.get(f"/assets/{asset['id']}/links").json()
            thumbnail = client.get(links["thumbnail"])
            assert thumbnail.status_code == 200 and thumbnail.content[:2] == b"\xff\xd8"
            assert client.get(links["original"]).content == data
        for name, data in (
            ("fake.pdf", b"hello"),
            ("binary.txt", b"\x00\x01\x02"),
            ("noise.png", b"not an image"),
            ("noise.mp3", b"not audio"),
            ("page.html", b"<script></script>"),
        ):
            result = client.post(f"/projects/{pid}/assets", files={"file": (name, data)})
            assert result.status_code == 422, name
        assert len(client.get(f"/projects/{pid}/assets").json()) == len(files)
