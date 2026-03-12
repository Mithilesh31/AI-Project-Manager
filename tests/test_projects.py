"""
Tests for /api/projects endpoints.
Covers: create, read, update, delete, and validation rules.
"""


def test_get_projects_empty(client):
    res = client.get("/api/projects/")
    assert res.status_code == 200
    assert res.get_json() == []


def test_create_project_success(client):
    res = client.post("/api/projects/", json={"name": "My App", "description": "desc"})
    data = res.get_json()
    assert res.status_code == 201
    assert data["name"] == "My App"
    assert data["description"] == "desc"
    assert "id" in data


def test_create_project_missing_name(client):
    res = client.post("/api/projects/", json={"description": "no name"})
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_create_project_empty_name(client):
    res = client.post("/api/projects/", json={"name": "   "})
    assert res.status_code == 400


def test_create_project_name_too_long(client):
    res = client.post("/api/projects/", json={"name": "x" * 201})
    assert res.status_code == 400


def test_create_project_invalid_color(client):
    res = client.post("/api/projects/", json={"name": "P", "color": "red"})
    assert res.status_code == 400


def test_create_project_valid_color(client):
    res = client.post("/api/projects/", json={"name": "P", "color": "#ff0000"})
    assert res.status_code == 201
    assert res.get_json()["color"] == "#ff0000"


def test_get_project_by_id(client, project):
    res = client.get(f"/api/projects/{project['id']}")
    assert res.status_code == 200
    assert res.get_json()["id"] == project["id"]


def test_get_project_not_found(client):
    res = client.get("/api/projects/9999")
    assert res.status_code == 404


def test_update_project(client, project):
    res = client.put(f"/api/projects/{project['id']}", json={"name": "Updated"})
    assert res.status_code == 200
    assert res.get_json()["name"] == "Updated"


def test_update_project_invalid_color(client, project):
    res = client.put(f"/api/projects/{project['id']}", json={"color": "blue"})
    assert res.status_code == 400


def test_delete_project(client, project):
    res = client.delete(f"/api/projects/{project['id']}")
    assert res.status_code == 200
    assert client.get(f"/api/projects/{project['id']}").status_code == 404


def test_delete_project_cascades_tasks(client, project, task):
    client.delete(f"/api/projects/{project['id']}")
    res = client.get(f"/api/tasks/{task['id']}")
    assert res.status_code == 404


def test_list_projects_after_create(client):
    client.post("/api/projects/", json={"name": "A"})
    client.post("/api/projects/", json={"name": "B"})
    res = client.get("/api/projects/")
    assert len(res.get_json()) == 2