"""Owner-scoped demo APIs. AI runs never overwrite creator edits."""

import time
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from creatorai.auth import get_owner
from creatorai.database import Analysis, Asset, Clip, Export, Project, Run
from creatorai.demo_schemas import (
    ClipDocument,
    ClipRead,
    ClipUpdate,
    Cover,
    ManualClip,
    ReviewDecision,
    RunRead,
    RunRequest,
    now,
)
from creatorai.storage import LocalStorage

router = APIRouter()
Owner = Annotated[str, Depends(get_owner)]


def owned(session, model, identifier, owner):
    value = session.scalar(
        select(model).where(model.id == str(identifier), model.owner_id == owner)
    )
    if value is None:
        raise HTTPException(404, "This item could not be found.")
    return value


@router.get("/projects/{project_id}/runs", response_model=list[RunRead])
def runs(project_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        owned(session, Project, project_id, owner)
        return session.scalars(
            select(Run)
            .where(Run.project_id == str(project_id), Run.owner_id == owner)
            .order_by(Run.created_at.desc())
            .limit(40)
        ).all()


@router.post("/projects/{project_id}/runs", response_model=RunRead, status_code=202)
def enqueue(project_id: UUID, body: RunRequest, request: Request, owner: Owner):
    state = request.app.state
    if body.kind != "export" and not state.settings.gemini_api_key.get_secret_value():
        raise HTTPException(
            503, "AI is waiting for the server's Gemini key. Editing and export still work."
        )
    with state.sessions() as session:
        project = owned(session, Project, project_id, owner)
        existing = session.get(Run, str(body.request_id))
        if existing:
            if existing.owner_id != owner or existing.project_id != str(project_id):
                raise HTTPException(404, "This task could not be found.")
            if existing.kind != body.kind or existing.input.get("request") != body.model_dump(
                mode="json"
            ):
                raise HTTPException(409, "This request ID belongs to a different task.")
            return existing
        active = session.scalar(
            select(Run.id)
            .where(Run.owner_id == owner, Run.status.in_(["queued", "running"]))
            .limit(1)
        )
        if active:
            raise HTTPException(
                409, "One of your tasks is still working. Wait for it to finish first."
            )
        payload = {
            "request": body.model_dump(mode="json"),
            "instruction": body.instruction,
            "story": {
                "title": project.title,
                "brief": project.brief,
                "platforms": project.platforms,
                "revision": project.revision,
            },
        }
        if body.kind in {"analyze", "clips"}:
            if not body.asset_id:
                raise HTTPException(422, "Select source footage first.")
            asset = owned(session, Asset, body.asset_id, owner)
            if asset.project_id != str(project_id):
                raise HTTPException(404, "This footage could not be found in this project.")
            payload["asset_id"] = asset.id
        if body.kind == "export":
            if not body.clip_id or not body.clip_revision:
                raise HTTPException(422, "Select a saved cut to export.")
            clip = owned(session, Clip, body.clip_id, owner)
            if clip.project_id != str(project_id):
                raise HTTPException(404, "This cut could not be found in this project.")
            if clip.revision != body.clip_revision:
                raise HTTPException(409, "This cut has a newer version. Reload before exporting.")
            payload.update(
                clip_id=clip.id,
                clip_revision=clip.revision,
                asset_id=clip.asset_id,
                document=clip.document,
                preset=body.preset,
            )
        run = Run(
            id=str(body.request_id),
            project_id=str(project_id),
            owner_id=owner,
            kind=body.kind,
            status="queued",
            stage="In the queue",
            input=payload,
            output={},
            events=[],
            error="",
            created_at=now(),
            updated_at=now(),
        )
        session.add(run)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            return owned(session, Run, body.request_id, owner)
        return run


@router.get("/runs/{run_id}", response_model=RunRead)
def run(run_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        return owned(session, Run, run_id, owner)


@router.post("/runs/{run_id}/decision", response_model=RunRead)
def decision(run_id: UUID, body: ReviewDecision, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        current = owned(session, Run, run_id, owner)
        if current.kind != "clips" or current.status != "review":
            raise HTTPException(409, "This agent is not waiting for a review.")
        cycles = current.input.get("review_cycles", 0)
        if body.action == "revise" and (not body.feedback.strip() or cycles >= 2):
            raise HTTPException(422, "Add feedback. This demo allows two agent revision rounds.")
        changed = session.execute(
            update(Run)
            .where(Run.id == current.id, Run.status == "review")
            .values(
                input={**current.input, "decision": body.model_dump(), "review_cycles": cycles + 1},
                status="queued",
                stage="Applying your review",
                updated_at=now(),
            )
        )
        if changed.rowcount != 1:
            raise HTTPException(409, "A review was already submitted. Refresh this task.")
        session.commit()
        session.expire_all()
        return owned(session, Run, run_id, owner)


@router.post("/runs/{run_id}/retry", response_model=RunRead)
def retry(run_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        current = owned(session, Run, run_id, owner)
        if current.status not in {"failed", "cancelled"}:
            raise HTTPException(409, "Only unfinished tasks can be retried.")
        if session.scalar(
            select(Run.id)
            .where(Run.owner_id == owner, Run.status.in_(["queued", "running"]))
            .limit(1)
        ):
            raise HTTPException(409, "Wait for your active task to finish first.")
        session.execute(
            update(Run)
            .where(Run.id == current.id, Run.status.in_(["failed", "cancelled"]))
            .values(status="queued", error="", stage="Retrying saved work", updated_at=now())
        )
        session.commit()
        session.expire_all()
        return owned(session, Run, run_id, owner)


@router.post("/runs/{run_id}/cancel", response_model=RunRead)
def cancel(run_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        current = owned(session, Run, run_id, owner)
        if current.status not in {"queued", "running"}:
            raise HTTPException(409, "This task has already stopped.")
        current.status, current.stage, current.updated_at = "cancelled", "Stopped by you", now()
        session.commit()
        return current


@router.get("/assets/{asset_id}/analysis")
def analysis(asset_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        owned(session, Asset, asset_id, owner)
        result = session.scalar(
            select(Analysis).where(Analysis.asset_id == str(asset_id), Analysis.owner_id == owner)
        )
        return {"ready": bool(result), "data": result.data if result else None}


@router.get("/projects/{project_id}/clips", response_model=list[ClipRead])
def clips(project_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        owned(session, Project, project_id, owner)
        return session.scalars(
            select(Clip)
            .where(Clip.project_id == str(project_id), Clip.owner_id == owner)
            .order_by(Clip.created_at.desc())
            .limit(60)
        ).all()


@router.post("/projects/{project_id}/clips", response_model=ClipRead, status_code=201)
def manual_clip(project_id: UUID, body: ManualClip, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        project = owned(session, Project, project_id, owner)
        asset = owned(session, Asset, body.asset_id, owner)
        if asset.project_id != str(project_id):
            raise HTTPException(404, "This footage could not be found in this project.")
        existing = session.get(Clip, str(body.request_id))
        if existing:
            if existing.owner_id != owner or existing.project_id != str(project_id):
                raise HTTPException(404, "This cut could not be found.")
            return existing
        identifier = str(body.request_id)
        if session.get(Run, identifier):
            raise HTTPException(409, "This request ID is already in use.")
        title = project.title[:100]
        index = session.get(Analysis, asset.id)
        document = ClipDocument(
            title=title,
            start=0,
            end=min(30, asset.duration),
            rationale="A creator-selected cut. Adjust its start, end and framing.",
            subtitle_segments=[s for s in index.data["transcript"] if s["start"] < 30]
            if index
            else [],
            cover=Cover(title=title),
        )
        session.add(
            Run(
                id=identifier,
                project_id=str(project_id),
                owner_id=owner,
                kind="manual",
                status="completed",
                stage="Created by you",
                input={},
                output={},
                events=[],
                error="",
                created_at=now(),
                updated_at=now(),
            )
        )
        session.flush()
        value = Clip(
            id=identifier,
            project_id=str(project_id),
            owner_id=owner,
            asset_id=asset.id,
            run_id=identifier,
            revision=1,
            script_revision=project.revision,
            document=document.model_dump(),
            created_at=now(),
            updated_at=now(),
        )
        session.add(value)
        session.commit()
        return value


@router.put("/clips/{clip_id}", response_model=ClipRead)
def save_clip(clip_id: UUID, body: ClipUpdate, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        current = owned(session, Clip, clip_id, owner)
        asset = owned(session, Asset, current.asset_id, owner)
        if body.document.end > asset.duration:
            raise HTTPException(422, "The cut must stay inside its source footage.")
        if any(s.end > asset.duration for s in body.document.subtitle_segments):
            raise HTTPException(422, "Caption timestamps must stay inside the footage.")
        result = session.execute(
            update(Clip)
            .where(Clip.id == str(clip_id), Clip.owner_id == owner, Clip.revision == body.revision)
            .values(
                document=body.document.model_dump(), revision=body.revision + 1, updated_at=now()
            )
        )
        if result.rowcount != 1:
            raise HTTPException(
                409, "A newer edit was saved. Copy your changes, then reload this cut."
            )
        session.commit()
        session.expire_all()
        return owned(session, Clip, clip_id, owner)


@router.get("/projects/{project_id}/exports")
def exports(project_id: UUID, request: Request, owner: Owner):
    with request.app.state.sessions() as session:
        owned(session, Project, project_id, owner)
        rows = session.scalars(
            select(Export)
            .where(Export.project_id == str(project_id), Export.owner_id == owner)
            .order_by(Export.created_at.desc())
            .limit(60)
        ).all()
        return [
            {
                key: getattr(row, key)
                for key in [
                    "id",
                    "clip_id",
                    "clip_revision",
                    "preset",
                    "bytes",
                    "duration",
                    "created_at",
                ]
            }
            for row in rows
        ]


@router.get("/exports/{export_id}/links")
def export_links(export_id: UUID, request: Request, owner: Owner):
    storage = request.app.state.storage
    with request.app.state.sessions() as session:
        row = owned(session, Export, export_id, owner)

        def link(key, kind):
            if isinstance(storage, LocalStorage):
                expiry = int(time.time()) + 300
                signature = storage.sign(row.id, "export-" + kind, expiry)
                return f"/downloads/{row.id}/{kind}?expires={expiry}&signature={signature}"
            return storage.link(key, row.id, kind)

        return {
            "video": link(row.video_key, "video"),
            "package": link(row.package_key, "package"),
            "expires_in": 300,
        }


@router.get("/downloads/{export_id}/{kind}")
def download(
    export_id: UUID,
    kind: Literal["video", "package"],
    expires: int,
    signature: str,
    request: Request,
):
    storage = request.app.state.storage
    if not isinstance(storage, LocalStorage) or not storage.verify(
        str(export_id), "export-" + kind, expires, signature
    ):
        raise HTTPException(403, "This download link expired. Refresh your delivery page.")
    with request.app.state.sessions() as session:
        row = session.get(Export, str(export_id))
        if row is None:
            raise HTTPException(404, "This export could not be found.")
        return FileResponse(
            storage.path(row.video_key if kind == "video" else row.package_key),
            media_type="video/mp4" if kind == "video" else "application/zip",
            filename="creatorai.mp4" if kind == "video" else "creatorai-editable.zip",
        )
