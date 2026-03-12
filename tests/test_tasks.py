"""
Tests for /api/tasks endpoints.
Covers: create, read, update, delete, status patch, tag handling, and validation.
"""


def test_create_task_success(client, project):
    res = client.post("/api/tasks/", json={
        "title": "Build API",
        "project_id": project["id"],
        "priority": "high",
        "status": "todo",
    })
    data = res.get_json()
    assert res.status_code == 201
    assert data["title"] == "Build API"
    assert data["priority"] == "high"
    assert data["status"] == "todo"


def test_create_task_missing_title(client, project):
    res = client.post("/api/tasks/", json={"project_id": project["id"]})
    assert res.status_code == 400


def test_create_task_missing_project_id(client):
    res = client.post("/api/tasks/", json={"title": "Task"})
    assert res.status_code == 400


def test_create_task_invalid_project(client):
    res = client.post("/api/tasks/", json={"title": "X", "project_id": 9999})
    assert res.status_code == 404


def test_create_task_invalid_status(client, project):
    res = client.post("/api/tasks/", json={
        "title": "T", "project_id": project["id"], "status": "flying"
    })
    assert res.status_code == 400


def test_create_task_invalid_priority(client, project):
    res = client.post("/api/tasks/", json={
        "title": "T", "project_id": project["id"], "priority": "critical"
    })
    assert res.status_code == 400


def test_create_task_with_tags(client, project):
    res = client.post("/api/tasks/", json={
        "title": "Tagged", "project_id": project["id"],
        "tags": ["backend", "api"]
    })
    data = res.get_json()
    assert res.status_code == 201
    assert set(data["tags"]) == {"backend", "api"}


def test_get_task(client, task):
    res = client.get(f"/api/tasks/{task['id']}")
    assert res.status_code == 200
    assert res.get_json()["id"] == task["id"]


def test_get_task_not_found(client):
    res = client.get("/api/tasks/9999")
    assert res.status_code == 404


def test_update_task_title(client, task):
    res = client.put(f"/api/tasks/{task['id']}", json={"title": "New Title"})
    assert res.status_code == 200
    assert res.get_json()["title"] == "New Title"


def test_update_task_invalid_status(client, task):
    res = client.put(f"/api/tasks/{task['id']}", json={"status": "done-ish"})
    assert res.status_code == 400


def test_update_task_status_via_patch(client, task):
    res = client.patch(f"/api/tasks/{task['id']}/status", json={"status": "in_progress"})
    assert res.status_code == 200
    assert res.get_json()["status"] == "in_progress"


def test_patch_status_invalid_value(client, task):
    res = client.patch(f"/api/tasks/{task['id']}/status", json={"status": "maybe"})
    assert res.status_code == 400


def test_delete_task(client, task):
    res = client.delete(f"/api/tasks/{task['id']}")
    assert res.status_code == 200
    assert client.get(f"/api/tasks/{task['id']}").status_code == 404


def test_filter_tasks_by_status(client, project):
    client.post("/api/tasks/", json={"title": "T1", "project_id": project["id"], "status": "todo"})
    client.post("/api/tasks/", json={"title": "T2", "project_id": project["id"], "status": "done"})
    res = client.get("/api/tasks/?status=todo")
    tasks = res.get_json()
    assert all(t["status"] == "todo" for t in tasks)


def test_filter_tasks_invalid_status(client):
    res = client.get("/api/tasks/?status=invalid")
    assert res.status_code == 400


def test_tags_are_lowercased(client, project):
    res = client.post("/api/tasks/", json={
        "title": "T", "project_id": project["id"],
        "tags": ["Backend", "API"]
    })
    assert set(res.get_json()["tags"]) == {"backend", "api"}


def test_task_title_stripped(client, project):
    res = client.post("/api/tasks/", json={
        "title": "  spaces  ", "project_id": project["id"]
    })
    assert res.get_json()["title"] == "spaces"