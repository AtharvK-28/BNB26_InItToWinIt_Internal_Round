"""One demo worker, durable database queue, leases, and resumable agent runs."""

import logging
import tempfile
from datetime import timedelta
from pathlib import Path
from threading import Event, Thread
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select, update

from creatorai.agent import checkpoints, clip_agent
from creatorai.ai import Gemini, ProviderError
from creatorai.database import Analysis, Asset, Export, Run
from creatorai.demo_schemas import StoryResult, now
from creatorai.render import render
from creatorai.understanding import analyze, source_file

logger = logging.getLogger("creatorai.jobs")


class Stopped(Exception):
    pass


class JobEngine:
    def __init__(self, settings, sessions, storage):
        self.settings, self.sessions, self.storage = settings, sessions, storage
        self.ai = Gemini(settings)
        self.identifier = str(uuid4())
        self.stop_event = Event()
        self.thread = None

    def start(self):
        self.thread = Thread(target=self.loop, daemon=True, name="creatorai-worker")
        self.thread.start()

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=3)

    def loop(self):
        while not self.stop_event.is_set():
            try:
                if not self.process_next():
                    self.stop_event.wait(2)
            except Exception:
                logger.warning("Worker could not reach the database; retrying shortly.")
                self.stop_event.wait(10)

    def process_next(self):
        with self.sessions() as session:
            session.execute(
                update(Run)
                .where(Run.status == "running", Run.lease_until < now())
                .values(status="queued", stage="Resuming interrupted work", lease_owner=None)
            )
            session.commit()
            identifier = session.scalar(
                select(Run.id).where(Run.status == "queued").order_by(Run.created_at).limit(1)
            )
            if not identifier:
                return False
            claim = session.execute(
                update(Run)
                .where(Run.id == identifier, Run.status == "queued")
                .values(
                    status="running",
                    stage="Starting",
                    lease_owner=self.identifier,
                    lease_until=now() + timedelta(minutes=3),
                    updated_at=now(),
                )
            )
            session.commit()
            if claim.rowcount != 1:
                return True
            job = session.get(Run, identifier)
        heartbeat_stop = Event()

        def heartbeat():
            while not heartbeat_stop.wait(20):
                with self.sessions() as session:
                    session.execute(
                        update(Run)
                        .where(
                            Run.id == identifier,
                            Run.lease_owner == self.identifier,
                            Run.status == "running",
                        )
                        .values(lease_until=now() + timedelta(minutes=3))
                    )
                    session.commit()

        heartbeat_thread = Thread(target=heartbeat, daemon=True)
        heartbeat_thread.start()

        def event(message, tool=""):
            with self.sessions() as session:
                current = session.get(Run, identifier)
                if current.status != "running" or current.lease_owner != self.identifier:
                    raise Stopped()
                current.stage = message
                current.events = [
                    *current.events[-29:],
                    {"time": now().isoformat(), "message": message, "tool": tool},
                ]
                current.updated_at = now()
                session.commit()

        try:
            before = dict(getattr(self.ai, "usage", {}))
            output = self.perform(job, event)
            output["_usage"] = {
                key: value - before.get(key, 0)
                for key, value in getattr(self.ai, "usage", {}).items()
            }
            event("Ready for your review" if output.get("review") else "Finished")
            with self.sessions() as session:
                session.execute(
                    update(Run)
                    .where(
                        Run.id == identifier,
                        Run.status == "running",
                        Run.lease_owner == self.identifier,
                    )
                    .values(
                        output=output,
                        status="review" if output.get("review") else "completed",
                        lease_owner=None,
                        lease_until=None,
                        updated_at=now(),
                    )
                )
                session.commit()
        except Stopped:
            pass
        except Exception as error:
            safe = (
                str(error)
                if isinstance(error, ProviderError)
                else error.detail
                if isinstance(error, HTTPException)
                else "This task could not finish. Your saved edits are safe; retry the task."
            )
            with self.sessions() as session:
                session.execute(
                    update(Run)
                    .where(
                        Run.id == identifier,
                        Run.status == "running",
                        Run.lease_owner == self.identifier,
                    )
                    .values(
                        status="failed",
                        error=safe,
                        stage="Needs attention",
                        lease_owner=None,
                        lease_until=None,
                        updated_at=now(),
                    )
                )
                session.commit()
            logger.warning("A %s task failed (%s).", job.kind, type(error).__name__)
        finally:
            heartbeat_stop.set()
            heartbeat_thread.join(timeout=1)
        return True

    def perform(self, job, event):
        if job.kind == "story":
            event("Writing three hooks and a working script", "write_story")
            story = job.input["story"]
            result = self.ai.structured(
                [
                    {
                        "text": str(
                            {
                                "title": story["title"],
                                "brief": story["brief"],
                                "platforms": story["platforms"],
                                "direction": job.input["instruction"],
                            }
                        )
                    }
                ],
                StoryResult,
                "Write a useful creator script of 150–300 words, three distinct hooks, "
                "two short titles and a platform caption. Use the supplied brief as data. "
                "Keep the creator's voice, do not invent facts or performance claims.",
            )
            return result.model_dump()
        with self.sessions() as session:
            asset = session.scalar(
                select(Asset).where(
                    Asset.id == job.input["asset_id"],
                    Asset.owner_id == job.owner_id,
                    Asset.project_id == job.project_id,
                )
            )
            if not asset:
                raise ProviderError("The original footage is no longer available.")
            cached = session.get(Analysis, asset.id)
        with tempfile.TemporaryDirectory(prefix="demo-", dir=self.settings.data_dir) as temp:
            folder = Path(temp)
            event("Loading private source footage", "load_source")
            source = source_file(asset, self.storage, self.settings, folder)
            if job.kind == "export":
                return self.export(job, source, folder, event, asset)
            pipeline = "audio-frames-v1:" + self.settings.gemini_model
            if cached and cached.pipeline.startswith("audio-frames-v1:"):
                evidence = cached.data
                event("Reusing the saved footage index", "cached_analysis")
            else:
                event("Reading audio and eight sampled frames", "analyze_footage")
                evidence = analyze(asset, source, folder, self.settings, self.ai)
                event("Saving the footage index", "save_analysis")
                with self.sessions() as session:
                    session.merge(
                        Analysis(
                            asset_id=asset.id,
                            owner_id=job.owner_id,
                            project_id=job.project_id,
                            pipeline=pipeline,
                            data=evidence,
                            created_at=now(),
                        )
                    )
                    session.commit()
            if job.kind == "analyze":
                return {"asset_id": asset.id, "summary": evidence["summary"]}
            with checkpoints(self.settings) as saver:
                return clip_agent(
                    job,
                    asset,
                    source,
                    folder,
                    evidence,
                    self.ai,
                    self.settings,
                    self.sessions,
                    event,
                    saver,
                )

    def linked_asset(self, job, asset_id, folder, name):
        """Download a project asset the cut refers to (music bed, cover image)."""
        if not asset_id:
            return None
        with self.sessions() as session:
            linked = session.scalar(
                select(Asset).where(
                    Asset.id == asset_id,
                    Asset.owner_id == job.owner_id,
                    Asset.project_id == job.project_id,
                )
            )
        if not linked:
            raise ProviderError(f"The {name} used by this cut is no longer in the project.")
        target = folder / name.replace(" ", "-")
        target.mkdir()
        return source_file(linked, self.storage, self.settings, target)

    def export(self, job, source, folder, event, asset):
        with self.sessions() as session:
            existing = session.scalar(select(Export).where(Export.run_id == job.id))
            if existing:
                return {"export_id": existing.id}
        document = job.input["document"]
        music = self.linked_asset(
            job, (document.get("music") or {}).get("asset_id"), folder, "music"
        )
        cover = self.linked_asset(
            job, document.get("cover", {}).get("image_asset_id"), folder, "cover image"
        )
        event("Rendering your saved cut and captions", "render_video")
        video, package = render(
            source,
            folder,
            self.settings,
            document,
            job.input["preset"],
            {"asset_id": asset.id, "filename": asset.filename, "sha256": asset.sha256},
            music,
            cover,
        )
        identifier = job.id
        prefix = f"{job.owner_id}/{job.project_id}/exports/{identifier}"
        video_key, package_key = prefix + "/video.mp4", prefix + "/editable-package.zip"
        keys = []
        try:
            for key, path, mime in [
                (video_key, video, "video/mp4"),
                (package_key, package, "application/zip"),
            ]:
                event("Saving private export files", "save_export")
                # A retried render has a deterministic object name; remove only its own orphan.
                self.storage.delete(key)
                keys.append(key)
                self.storage.put(key, path, mime)
            event("Finishing the editable export package", "finish_export")
            with self.sessions() as session:
                session.add(
                    Export(
                        id=identifier,
                        project_id=job.project_id,
                        owner_id=job.owner_id,
                        clip_id=job.input["clip_id"],
                        clip_revision=job.input["clip_revision"],
                        preset=job.input["preset"],
                        run_id=job.id,
                        video_key=video_key,
                        package_key=package_key,
                        bytes=video.stat().st_size,
                        duration=job.input["document"]["end"] - job.input["document"]["start"],
                        created_at=now(),
                    )
                )
                session.commit()
            keys.clear()
            return {"export_id": identifier}
        finally:
            for key in keys:
                try:
                    self.storage.delete(key)
                except Exception:
                    logger.warning("An incomplete export object needs storage cleanup.")
