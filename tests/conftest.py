"""
Shared pytest fixtures.
Each test gets a fresh in-memory SQLite database — no leftover state.
"""
import os
import pytest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TESTING"]      = "true"

from backend.app import create_app, db as _db


@pytest.fixture(scope="function")
def app():
    app = create_app()
    app.config["TESTING"] = True
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def project(client):
    """Create and return a sample project."""
    res = client.post("/api/projects/", json={"name": "Test Project", "description": "Demo"})
    return res.get_json()


@pytest.fixture
def task(client, project):
    """Create and return a sample task inside the sample project."""
    res = client.post("/api/tasks/", json={
        "title": "Test Task",
        "project_id": project["id"],
        "priority": "medium",
        "status": "todo",
    })
    return res.get_json()