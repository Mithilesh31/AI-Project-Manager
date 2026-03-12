"""
Unit tests for the validators module — tests rules in isolation, no DB needed.
"""
import pytest
from backend.validators import validate_project, validate_task, ValidationError


# ── Project validator ──────────────────────────────────────────────────────

def test_valid_project():
    data = validate_project({"name": "My App", "color": "#aabbcc"})
    assert data["name"] == "My App"
    assert data["color"] == "#aabbcc"

def test_project_name_stripped():
    data = validate_project({"name": "  hello  "})
    assert data["name"] == "hello"

def test_project_name_required():
    with pytest.raises(ValidationError) as exc:
        validate_project({})
    assert exc.value.field == "name"

def test_project_empty_name_raises():
    with pytest.raises(ValidationError):
        validate_project({"name": ""})

def test_project_name_too_long():
    with pytest.raises(ValidationError):
        validate_project({"name": "a" * 201})

def test_project_invalid_color():
    with pytest.raises(ValidationError) as exc:
        validate_project({"name": "X", "color": "red"})
    assert exc.value.field == "color"

def test_project_valid_hex_colors():
    for color in ["#000000", "#FFFFFF", "#1a2b3c"]:
        data = validate_project({"name": "X", "color": color})
        assert data["color"] == color

def test_project_none_body():
    with pytest.raises(ValidationError):
        validate_project(None)

def test_project_partial_update_no_name_required():
    data = validate_project({"description": "new desc"}, partial=True)
    assert data["description"] == "new desc"
    assert "name" not in data


# ── Task validator ─────────────────────────────────────────────────────────

def test_valid_task():
    data = validate_task({"title": "Do thing", "project_id": 1})
    assert data["title"] == "Do thing"
    assert data["project_id"] == 1

def test_task_title_stripped():
    data = validate_task({"title": "  spaces  ", "project_id": 1})
    assert data["title"] == "spaces"

def test_task_title_required():
    with pytest.raises(ValidationError) as exc:
        validate_task({"project_id": 1})
    assert exc.value.field == "title"

def test_task_project_id_required():
    with pytest.raises(ValidationError) as exc:
        validate_task({"title": "X"})
    assert exc.value.field == "project_id"

def test_task_invalid_status():
    with pytest.raises(ValidationError) as exc:
        validate_task({"title": "X", "project_id": 1, "status": "flying"})
    assert exc.value.field == "status"

def test_task_valid_statuses():
    for s in ["todo", "in_progress", "done"]:
        data = validate_task({"title": "X", "project_id": 1, "status": s})
        assert data["status"] == s

def test_task_invalid_priority():
    with pytest.raises(ValidationError) as exc:
        validate_task({"title": "X", "project_id": 1, "priority": "critical"})
    assert exc.value.field == "priority"

def test_task_tags_lowercased():
    data = validate_task({"title": "X", "project_id": 1, "tags": ["Backend", "API"]})
    assert set(data["tags"]) == {"backend", "api"}

def test_task_tags_must_be_list():
    with pytest.raises(ValidationError) as exc:
        validate_task({"title": "X", "project_id": 1, "tags": "backend"})
    assert exc.value.field == "tags"

def test_task_too_many_tags():
    with pytest.raises(ValidationError):
        validate_task({"title": "X", "project_id": 1, "tags": [f"tag{i}" for i in range(21)]})

def test_task_partial_update():
    data = validate_task({"status": "done"}, partial=True)
    assert data["status"] == "done"
    assert "title" not in data
    assert "project_id" not in data