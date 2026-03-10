from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.models import Project

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/", methods=["GET"])
def get_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([p.to_dict() for p in projects])


@projects_bp.route("/", methods=["POST"])
def create_project():
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Project name is required"}), 400

    project = Project(
        name=data["name"],
        description=data.get("description", ""),
        color=data.get("color", "#6366f1"),
    )
    db.session.add(project)
    db.session.commit()
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
    data = request.get_json()

    if "name" in data:
        project.name = data["name"]
    if "description" in data:
        project.description = data["description"]
    if "color" in data:
        project.color = data["color"]

    db.session.commit()
    return jsonify(project.to_dict())


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200
