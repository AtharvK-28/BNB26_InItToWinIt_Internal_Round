from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from creatorai.main import create_app


@pytest.fixture
def database_url(tmp_path):
    return f"sqlite:///{(tmp_path / 'test.db').as_posix()}"


@pytest.fixture
def client(database_url):
    with TestClient(create_app(database_url)) as value:
        yield value


def new_project(client):
    response = client.post(
        "/projects", json={"title": "  A better morning  ", "platforms": ["youtube", "instagram"]}
    )
    assert response.status_code == 201
    return response.json()


def test_project_survives_restart(database_url):
    with TestClient(create_app(database_url)) as client:
        project = new_project(client)
        assert project["title"] == "A better morning"
        project["brief"] = "Start with the sound of coffee."
        payload = {key: project[key] for key in ["title", "brief", "platforms", "revision"]}
        saved = client.put(f"/projects/{project['id']}", json=payload).json()
        assert saved["revision"] == 2
    with TestClient(create_app(database_url)) as client:
        assert client.get(f"/projects/{project['id']}").json()["brief"] == project["brief"]
        assert len(client.get("/projects").json()) == 1
        assert client.get(f"/projects/{project['id']}").json()["updated_at"].endswith("Z")


@pytest.mark.parametrize(
    "changes",
    [
        {"title": "   "},
        {"title": "x" * 121},
        {"platforms": []},
        {"platforms": ["youtube", "youtube"]},
        {"platforms": ["myspace"]},
        {"brief": "x" * 20001},
        {"invented_field": True},
    ],
)
def test_invalid_projects_do_not_persist(client, changes):
    payload = {"title": "My story", "platforms": ["youtube"], **changes}
    assert client.post("/projects", json=payload).status_code == 422
    assert client.get("/projects").json() == []


def test_two_editors_cannot_overwrite_each_other(client):
    project = new_project(client)
    payload = {key: project[key] for key in ["title", "brief", "platforms", "revision"]}
    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(
            executor.map(
                lambda _: client.put(f"/projects/{project['id']}", json=payload).status_code,
                range(2),
            )
        )
    assert sorted(statuses) == [200, 409]
    assert client.get(f"/projects/{project['id']}").json()["revision"] == 2


def test_unknown_project_and_untrusted_origin(client):
    assert client.get("/projects/00000000-0000-0000-0000-000000000000").status_code == 404
    assert client.get("/projects/not-an-id").status_code == 422
    response = client.post(
        "/projects",
        headers={"origin": "https://untrusted.example"},
        json={"title": "Blocked", "platforms": ["youtube"]},
    )
    assert response.status_code == 403
    assert client.get("/projects").json() == []
