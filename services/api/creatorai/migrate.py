"""Upgrade both the original SQLite prototype and clean Postgres deployments."""

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from creatorai.config import Settings

API_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_COLUMNS = {"id", "title", "brief", "platforms", "revision", "created_at", "updated_at"}


def upgrade_database(url, data_dir: Path):
    data_dir.mkdir(parents=True, exist_ok=True)
    config = Config(str(API_ROOT / "alembic.ini"))
    engine = create_engine(url)
    try:
        with engine.connect() as connection:
            inspector = inspect(connection)
            # Only recognize the exact old SQLite schema, never guess/stamp arbitrary databases.
            if (
                engine.dialect.name == "sqlite"
                and "projects" in inspector.get_table_names()
                and "alembic_version" not in inspector.get_table_names()
            ):
                actual = {column["name"] for column in inspector.get_columns("projects")}
                if actual != ORIGINAL_COLUMNS:
                    raise RuntimeError(
                        "Unknown legacy schema; review the database before migration."
                    )
                backup = (
                    data_dir / f"creatorai-before-migration-{datetime.now(UTC):%Y%m%d%H%M%S}.db"
                )
                with (
                    sqlite3.connect(engine.url.database) as source,
                    sqlite3.connect(backup) as target,
                ):
                    source.backup(target)
                connection.commit()
                config.attributes["connection"] = connection
                command.stamp(config, "0001")
                connection.commit()
            config.attributes["connection"] = connection
            command.upgrade(config, "head")
            connection.commit()
    finally:
        engine.dispose()


if __name__ == "__main__":
    settings = Settings()
    upgrade_database(settings.sql_url, settings.data_dir)
    print("CreatorAi schema is at the current migration version.")
