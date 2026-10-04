"""Run in CI against a fresh PostgreSQL service; never use a user's cloud database."""

import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from creatorai.config import Settings
from creatorai.main import create_app


@pytest.mark.skipif(
    not os.environ.get("TEST_POSTGRES_URL"), reason="CI PostgreSQL service required"
)
def test_postgres_migrations_and_api_restart(tmp_path):
    url = os.environ["TEST_POSTGRES_URL"]
    # This test service uses Postgres transport without TLS; it is not the cloud profile.
    settings = Settings(_env_file=None, data_dir=tmp_path)
    from creatorai.migrate import upgrade_database

    upgrade_database(url, tmp_path)
    from creatorai.database import make_database

    engine, sessions = make_database(url)
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT version_num FROM creatorai.alembic_version")) == "0003"
        )
        assert connection.scalar(
            text("SELECT relrowsecurity FROM pg_class WHERE oid='creatorai.projects'::regclass")
        )
    # Use the production routes over the real Postgres session factory.
    app = create_app(settings=settings)
    from creatorai.auth import get_owner

    owner = str(uuid4())
    app.dependency_overrides[get_owner] = lambda: owner
    with TestClient(app) as client:
        app.state.sessions = sessions
        response = client.post(
            "/projects", json={"title": "Postgres verification", "platforms": ["youtube"]}
        )
        assert response.status_code == 201
        project = response.json()
    with TestClient(app) as client:
        app.state.sessions = sessions
        assert client.get(f"/projects/{project['id']}").json()["title"] == project["title"]
        app.dependency_overrides[get_owner] = lambda: str(uuid4())
        assert client.get(f"/projects/{project['id']}").status_code == 404
    engine.dispose()
