"""Migrate and check durable Postgres writes without displaying connection details."""

import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from dotenv import dotenv_values
from sqlalchemy import delete, select, text
from sqlalchemy.engine import make_url

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services/api"))
from creatorai.database import Project, make_database
from creatorai.migrate import upgrade_database


def main():
    values = dotenv_values(ROOT / "services/api/.env")
    raw = values.get("DATABASE_URL", "") or ""
    if not raw.startswith(("postgres://", "postgresql://", "postgresql+psycopg://")):
        raise ValueError("A PostgreSQL DATABASE_URL is required.")
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    url = make_url(raw).set(drivername="postgresql+psycopg")
    if values.get("DATABASE_PASSWORD"):
        url = url.set(password=values["DATABASE_PASSWORD"])
    url = url.update_query_dict({"sslmode": "require", "connect_timeout": "10"})
    upgrade_database(url, ROOT / ".local")
    engine, sessions = make_database(url)
    project_id, owner = str(uuid4()), str(uuid4())
    try:
        now = datetime.now(UTC)
        with sessions() as session:
            session.add(
                Project(
                    id=project_id,
                    owner_id=owner,
                    title="Connection verification",
                    brief="Temporary database check",
                    platforms=["youtube"],
                    revision=1,
                    created_at=now,
                    updated_at=now,
                )
            )
            session.commit()
        with sessions() as session:
            project = session.scalar(
                select(Project).where(
                    Project.id == project_id, Project.owner_id == owner
                )
            )
            assert project is not None and project.revision == 1
            assert (
                session.scalar(
                    select(Project).where(
                        Project.id == project_id, Project.owner_id == str(uuid4())
                    )
                )
                is None
            )
        with engine.connect() as connection:
            revision = connection.scalar(
                text("SELECT version_num FROM creatorai.alembic_version")
            )
        print(
            f"Postgres verified: migration {revision}, durable write/read, owner filter."
        )
    finally:
        with sessions() as session:
            session.execute(
                delete(Project).where(
                    Project.id == project_id, Project.owner_id == owner
                )
            )
            session.commit()
        engine.dispose()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001 -- redact driver errors which may contain credentials
        print(
            f"Database check failed ({type(error).__name__}). Connection details were not displayed."
        )
        sys.exit(1)
