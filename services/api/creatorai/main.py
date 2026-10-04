import logging
import tempfile
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path
from threading import BoundedSemaphore
from typing import Annotated, Literal
from uuid import UUID, uuid4

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from creatorai.auth import TokenVerifier, get_owner
from creatorai.config import Settings
from creatorai.database import Asset, Project, make_database
from creatorai.demo_routes import router as demo_router
from creatorai.jobs import JobEngine
from creatorai.media import KINDS, inspect_asset, media_tools, receive
from creatorai.migrate import upgrade_database
from creatorai.schemas import AssetRead, ProjectFields, ProjectRead, ProjectUpdate
from creatorai.storage import LocalStorage, make_storage
from creatorai.upload_limit import UploadLimit

Owner = Annotated[str, Depends(get_owner)]
logger = logging.getLogger("creatorai")


def create_app(database_url: str | None = None, settings: Settings | None = None) -> FastAPI:
    config = settings or (
        Settings(
            _env_file=None,
            database_url=database_url,
            data_dir=Path(database_url.removeprefix("sqlite:///")).parent,
        )
        if database_url
        else Settings()
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        upgrade_database(config.sql_url, config.data_dir)
        engine, sessions = make_database(config.sql_url)
        app.state.sessions = sessions
        app.state.settings = config
        app.state.storage = make_storage(config)
        app.state.verifier = TokenVerifier(config) if config.app_mode == "cloud" else None
        app.state.import_slots = BoundedSemaphore(2)
        app.state.jobs = JobEngine(config, sessions, app.state.storage)
        if config.enable_demo_worker:
            app.state.jobs.start()
        yield
        app.state.jobs.stop()
        engine.dispose()

    app = FastAPI(title="CreatorAi API", version="0.2.0", lifespan=lifespan)
    app.include_router(demo_router)
    app.add_middleware(UploadLimit, max_bytes=(config.max_upload_mb + 1) * 1024 * 1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.origins,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Content-Type", "Authorization", "Range"],
        expose_headers=["Content-Range", "Accept-Ranges"],
    )

    @app.middleware("http")
    async def origin_and_cache(request: Request, call_next):
        origin = request.headers.get("origin")
        if origin and origin not in config.origins:
            return Response(status_code=403)
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    def owned_project(session, project_id, owner):
        project = session.scalar(
            select(Project).where(Project.id == str(project_id), Project.owner_id == owner)
        )
        if project is None:
            raise HTTPException(404, "This project could not be found.")
        return project

    @app.get("/health")
    def health():
        return {"status": "ok", "mode": config.app_mode, "version": "0.2.0"}

    @app.get("/capabilities")
    def capabilities(owner: Owner):
        try:
            media_tools(config)
            ready = True
        except HTTPException:
            ready = False
        return {
            "media_import": ready,
            "max_upload_mb": config.max_upload_mb,
            "max_clip_seconds": config.max_clip_seconds,
            "max_audio_seconds": config.max_audio_seconds,
            "ai_ready": bool(config.gemini_api_key.get_secret_value()),
            "worker_ready": config.enable_demo_worker,
            "ai_model": config.gemini_model,
        }

    @app.get("/projects", response_model=list[ProjectRead])
    def list_projects(owner: Owner):
        with app.state.sessions() as session:
            return session.scalars(
                select(Project).where(Project.owner_id == owner).order_by(Project.updated_at.desc())
            ).all()

    @app.post("/projects", response_model=ProjectRead, status_code=201)
    def create_project(body: ProjectFields, owner: Owner):
        now = datetime.now(UTC)
        project = Project(
            id=str(uuid4()),
            owner_id=owner,
            **body.model_dump(),
            revision=1,
            created_at=now,
            updated_at=now,
        )
        with app.state.sessions() as session:
            session.add(project)
            session.commit()
            return project

    @app.get("/projects/{project_id}", response_model=ProjectRead)
    def get_project(project_id: UUID, owner: Owner):
        with app.state.sessions() as session:
            return owned_project(session, project_id, owner)

    @app.put("/projects/{project_id}", response_model=ProjectRead)
    def save_project(project_id: UUID, body: ProjectUpdate, owner: Owner):
        with app.state.sessions() as session:
            result = session.execute(
                update(Project)
                .where(
                    Project.id == str(project_id),
                    Project.owner_id == owner,
                    Project.revision == body.revision,
                )
                .values(
                    **body.model_dump(exclude={"revision"}),
                    revision=body.revision + 1,
                    updated_at=datetime.now(UTC),
                )
            )
            if result.rowcount != 1:
                owned_project(session, project_id, owner)
                raise HTTPException(
                    409, "A newer version was saved. Download your draft before loading the latest."
                )
            session.commit()
            return owned_project(session, project_id, owner)

    @app.get("/projects/{project_id}/assets", response_model=list[AssetRead])
    def list_assets(project_id: UUID, owner: Owner):
        with app.state.sessions() as session:
            owned_project(session, project_id, owner)
            return session.scalars(
                select(Asset)
                .where(Asset.project_id == str(project_id), Asset.owner_id == owner)
                .order_by(Asset.created_at.desc())
            ).all()

    @app.post("/projects/{project_id}/assets", response_model=AssetRead, status_code=201)
    def import_asset(project_id: UUID, file: UploadFile, owner: Owner):
        with app.state.sessions() as session:
            owned_project(session, project_id, owner)
        media_tools(config)
        if not app.state.import_slots.acquire(blocking=False):
            raise HTTPException(503, "Two clips are being imported. Try again once one finishes.")
        stored = []
        try:
            suffix = Path(file.filename or "").suffix.lower()
            if suffix not in KINDS:
                raise HTTPException(
                    422,
                    "Choose a video (MP4, WebM, MOV), image (JPG, PNG, WebP, GIF), "
                    "audio (MP3, WAV, M4A, AAC, OGG, FLAC) or document (PDF, TXT, MD, SRT).",
                )
            with tempfile.TemporaryDirectory(prefix="creatorai-", dir=config.data_dir) as temp:
                source, thumbnail = Path(temp) / f"original{suffix}", Path(temp) / "thumbnail.jpg"
                size, digest = receive(file, source, config.max_upload_mb * 1024 * 1024)
                with app.state.sessions() as session:
                    existing = session.scalar(
                        select(Asset).where(
                            Asset.project_id == str(project_id),
                            Asset.sha256 == digest,
                            Asset.owner_id == owner,
                        )
                    )
                    if existing:
                        return existing
                media = inspect_asset(KINDS[suffix], source, thumbnail, config)
                asset_id = str(uuid4())
                prefix = f"{owner}/{project_id}/{asset_id}"
                original_key, thumbnail_key = (
                    f"{prefix}/original{suffix}",
                    f"{prefix}/thumbnail.jpg",
                )
                for key, path, content_type in [
                    (original_key, source, media["content_type"]),
                    (thumbnail_key, thumbnail, "image/jpeg"),
                ]:
                    stored.append(key)
                    app.state.storage.put(key, path, content_type)
                filename = (
                    (file.filename or "Untitled file").replace("\\", "/").split("/")[-1][:240]
                )
                asset = Asset(
                    id=asset_id,
                    project_id=str(project_id),
                    owner_id=owner,
                    filename=filename,
                    bytes=size,
                    sha256=digest,
                    **media,
                    original_key=original_key,
                    thumbnail_key=thumbnail_key,
                    created_at=datetime.now(UTC),
                )
                with app.state.sessions() as session:
                    session.add(asset)
                    session.commit()
                stored.clear()
                return asset
        except IntegrityError:
            with app.state.sessions() as session:
                existing = session.scalar(
                    select(Asset).where(
                        Asset.project_id == str(project_id),
                        Asset.sha256 == digest,
                        Asset.owner_id == owner,
                    )
                )
                if existing:
                    return existing
            raise HTTPException(
                409, "The clip could not be saved. Reload material and try again."
            ) from None
        except (httpx.HTTPError, ValueError, OSError):
            raise HTTPException(
                503, "Media storage is unavailable. Your original file is unchanged; try again."
            ) from None
        finally:
            for key in stored:
                try:
                    app.state.storage.delete(key)
                except Exception:
                    logger.warning("Could not clean an incomplete media object; review storage.")
            file.file.close()
            app.state.import_slots.release()

    @app.get("/assets/{asset_id}/links")
    def asset_links(asset_id: UUID, owner: Owner):
        with app.state.sessions() as session:
            asset = session.scalar(
                select(Asset).where(Asset.id == str(asset_id), Asset.owner_id == owner)
            )
            if not asset:
                raise HTTPException(404, "This clip could not be found.")
            try:
                return {
                    "original": app.state.storage.link(asset.original_key, asset.id, "original"),
                    "thumbnail": app.state.storage.link(asset.thumbnail_key, asset.id, "thumbnail"),
                    "expires_in": 300,
                }
            except (httpx.HTTPError, ValueError):
                raise HTTPException(
                    503, "Clip preview is unavailable. Try again in a moment."
                ) from None

    @app.get("/media/{asset_id}/{kind}")
    def local_media(
        asset_id: UUID, kind: Literal["original", "thumbnail"], expires: int, signature: str
    ):
        storage = app.state.storage
        if not isinstance(storage, LocalStorage) or not storage.verify(
            str(asset_id), kind, expires, signature
        ):
            raise HTTPException(403, "This preview link has expired. Reopen the clip.")
        with app.state.sessions() as session:
            asset = session.get(Asset, str(asset_id))
            if not asset:
                raise HTTPException(404, "This clip could not be found.")
            path = storage.path(asset.original_key if kind == "original" else asset.thumbnail_key)
            if not path.is_file():
                raise HTTPException(404, "The original file is unavailable.")
            return FileResponse(
                path, media_type=asset.content_type if kind == "original" else "image/jpeg"
            )

    return app
