from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.models import Project
from backend.validators import validate_project, ValidationError
from backend.logger import logger

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/", methods=["GET"])
def get_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    logger.debug("GET /projects — returned %d projects", len(projects))
    return jsonify([p.to_dict() for p in projects])


@projects_bp.route("/", methods=["POST"])
def create_project():
    data = request.get_json(silent=True)
    cleaned = validate_project(data)

    project = Project(
        name=cleaned["name"],
        description=cleaned.get("description", ""),
        color=cleaned.get("color", "#6366f1"),
    )
    db.session.add(project)
    db.session.commit()
    logger.info("Created project id=%d name=%r", project.id, project.name)
    return jsonify(project.to_dict()), 201


@projects_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    result = project.to_dict()
    result["tasks"] = [t.to_dict() for t in project.tasks]
    return jsonify(result)


@projects_bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json(silent=True)
    cleaned = validate_project(data, partial=True)

    for field, value in cleaned.items():
        setattr(project, field, value)

    db.session.commit()
    logger.info("Updated project id=%d", project_id)
    return jsonify(project.to_dict())


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    logger.info("Deleted project id=%d", project_id)
    return jsonify({"message": "Project deleted"}), 200