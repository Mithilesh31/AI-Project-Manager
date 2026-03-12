from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.models import Task, Tag, Project
from backend.validators import validate_task, VALID_STATUSES, ValidationError
from backend.logger import logger

tasks_bp = Blueprint("tasks", __name__)


def get_or_create_tag(name: str) -> Tag:
    tag = Tag.query.filter_by(name=name.lower().strip()).first()
    if not tag:
        tag = Tag(name=name.lower().strip())
        db.session.add(tag)
    return tag


def parse_due_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None


@tasks_bp.route("/", methods=["GET"])
def get_tasks():
    project_id = request.args.get("project_id", type=int)
    status     = request.args.get("status")
    priority   = request.args.get("priority")

    # Validate query params
    if status and status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of: {', '.join(sorted(VALID_STATUSES))}"}), 400

    query = Task.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)

    tasks = query.order_by(Task.created_at.desc()).all()
    logger.debug("GET /tasks — returned %d tasks", len(tasks))
    return jsonify([t.to_dict() for t in tasks])


@tasks_bp.route("/", methods=["POST"])
def create_task():
    data    = request.get_json(silent=True)
    cleaned = validate_task(data)

    project = Project.query.get(cleaned["project_id"])
    if not project:
        logger.warning("create_task: project_id=%d not found", cleaned["project_id"])
        return jsonify({"error": "Project not found"}), 404

    task = Task(
        title=cleaned["title"],
        description=cleaned.get("description", ""),
        status=cleaned.get("status", "todo"),
        priority=cleaned.get("priority", "medium"),
        due_date=parse_due_date(cleaned.get("due_date")),
        project_id=cleaned["project_id"],
    )

    for tag_name in cleaned.get("tags", []):
        task.tags.append(get_or_create_tag(tag_name))

    db.session.add(task)
    db.session.commit()
    logger.info("Created task id=%d title=%r project_id=%d", task.id, task.title, task.project_id)
    return jsonify(task.to_dict()), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task    = Task.query.get_or_404(task_id)
    data    = request.get_json(silent=True)
    cleaned = validate_task(data, partial=True)

    if "title"       in cleaned: task.title       = cleaned["title"]
    if "description" in cleaned: task.description = cleaned["description"]
    if "status"      in cleaned: task.status      = cleaned["status"]
    if "priority"    in cleaned: task.priority    = cleaned["priority"]
    if "due_date"    in cleaned: task.due_date    = parse_due_date(cleaned["due_date"])
    if "tags"        in cleaned: task.tags        = [get_or_create_tag(n) for n in cleaned["tags"]]

    if "ai_summary" in (data or {}):
        task.ai_summary = str(data["ai_summary"])[:2000]

    db.session.commit()
    logger.info("Updated task id=%d", task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    logger.info("Deleted task id=%d", task_id)
    return jsonify({"message": "Task deleted"}), 200


@tasks_bp.route("/<int:task_id>/status", methods=["PATCH"])
def update_status(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    status = data.get("status")
    if status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of: {', '.join(sorted(VALID_STATUSES))}"}), 400
    task.status = status
    db.session.commit()
    logger.info("Task id=%d status -> %s", task_id, status)
    return jsonify(task.to_dict())