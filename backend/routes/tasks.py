from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.models import Task, Tag, Project

tasks_bp = Blueprint("tasks", __name__)


def get_or_create_tag(name):
    tag = Tag.query.filter_by(name=name.lower().strip()).first()
    if not tag:
        tag = Tag(name=name.lower().strip())
        db.session.add(tag)
    return tag


@tasks_bp.route("/", methods=["GET"])
def get_tasks():
    project_id = request.args.get("project_id", type=int)
    status = request.args.get("status")
    priority = request.args.get("priority")

    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@tasks_bp.route("/", methods=["POST"])
def create_task():
    data = request.get_json()
    if not data or not data.get("title") or not data.get("project_id"):
        return jsonify({"error": "Title and project_id are required"}), 400

    project = Project.query.get(data["project_id"])
    if not project:
        return jsonify({"error": "Project not found"}), 404

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.fromisoformat(data["due_date"])
        except ValueError:
            pass

    task = Task(
        title=data["title"],
        description=data.get("description", ""),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        due_date=due_date,
        project_id=data["project_id"],
    )

    if data.get("tags"):
        for tag_name in data["tags"]:
            task.tags.append(get_or_create_tag(tag_name))

    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    if "title" in data:
        task.title = data["title"]
    if "description" in data:
        task.description = data["description"]
    if "status" in data:
        task.status = data["status"]
    if "priority" in data:
        task.priority = data["priority"]
    if "ai_summary" in data:
        task.ai_summary = data["ai_summary"]
    if "due_date" in data:
        try:
            task.due_date = datetime.fromisoformat(data["due_date"]) if data["due_date"] else None
        except ValueError:
            pass
    if "tags" in data:
        task.tags = [get_or_create_tag(name) for name in data["tags"]]

    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


@tasks_bp.route("/<int:task_id>/status", methods=["PATCH"])
def update_status(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    valid = ["todo", "in_progress", "done"]
    if data.get("status") not in valid:
        return jsonify({"error": f"Status must be one of {valid}"}), 400
    task.status = data["status"]
    db.session.commit()
    return jsonify(task.to_dict())
