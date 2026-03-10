import os
import json
from groq import Groq
from flask import Blueprint, request, jsonify
from backend.models.models import Task, Project
from backend.app import db

ai_bp = Blueprint("ai", __name__)

MODEL = "llama-3.3-70b-versatile"


def get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY", ""))


def chat(client, prompt, max_tokens=300):
    """Helper: single-turn chat completion via Groq."""
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()


@ai_bp.route("/summarize/<int:task_id>", methods=["POST"])
def summarize_task(task_id):
    """Generate an AI summary for a task based on its title and description."""
    task = Task.query.get_or_404(task_id)

    if not task.description:
        return jsonify({"error": "Task has no description to summarize"}), 400

    try:
        client = get_client()
        prompt = (
            f"Summarize the following task in 1-2 concise sentences. "
            f"Focus on the key action and outcome.\n\n"
            f"Task: {task.title}\nDescription: {task.description}"
        )
        summary = chat(client, prompt, max_tokens=200)
        task.ai_summary = summary
        db.session.commit()
        return jsonify({"summary": summary, "task": task.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/suggest-tasks", methods=["POST"])
def suggest_tasks():
    """Suggest new tasks for a project based on its existing tasks and description."""
    data = request.get_json()
    project_id = data.get("project_id")

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    project = Project.query.get_or_404(project_id)
    existing_tasks = [t.title for t in project.tasks]

    try:
        client = get_client()
        prompt = (
            f"You are a project planning assistant.\n\n"
            f"Project: {project.name}\n"
            f"Description: {project.description or 'No description'}\n"
            f"Existing tasks: {json.dumps(existing_tasks)}\n\n"
            f"Suggest 5 additional tasks that would help complete this project. "
            f"Return ONLY a JSON array of objects, each with 'title', 'description', and 'priority' (low/medium/high). "
            f"Do not include tasks that already exist. No markdown, no explanation. Raw JSON only."
        )
        raw = chat(client, prompt, max_tokens=800)
        raw = raw.replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(raw)
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/prioritize", methods=["POST"])
def prioritize_tasks():
    """Re-prioritize tasks for a project using AI."""
    data = request.get_json()
    project_id = data.get("project_id")

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    project = Project.query.get_or_404(project_id)
    pending_tasks = [t for t in project.tasks if t.status != "done"]

    if not pending_tasks:
        return jsonify({"error": "No pending tasks to prioritize"}), 400

    tasks_data = [{"id": t.id, "title": t.title, "description": t.description} for t in pending_tasks]

    try:
        client = get_client()
        prompt = (
            f"You are a project management expert.\n\n"
            f"Project: {project.name}\n"
            f"Tasks to prioritize: {json.dumps(tasks_data)}\n\n"
            f"Assign a priority (low/medium/high) to each task based on typical project management principles. "
            f"Return ONLY a JSON array of objects with 'id' and 'priority'. "
            f"No markdown, no explanation. Raw JSON only."
        )
        raw = chat(client, prompt, max_tokens=500)
        raw = raw.replace("```json", "").replace("```", "").strip()
        priorities = json.loads(raw)

        updated = []
        for item in priorities:
            task = Task.query.get(item["id"])
            if task and item["priority"] in ["low", "medium", "high"]:
                task.priority = item["priority"]
                updated.append(task.to_dict())

        db.session.commit()
        return jsonify({"updated_tasks": updated})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route("/project-summary/<int:project_id>", methods=["GET"])
def project_summary(project_id):
    """Generate a natural-language status summary for a project."""
    project = Project.query.get_or_404(project_id)
    tasks = project.tasks

    todo = [t.title for t in tasks if t.status == "todo"]
    in_progress = [t.title for t in tasks if t.status == "in_progress"]
    done = [t.title for t in tasks if t.status == "done"]

    try:
        client = get_client()
        prompt = (
            f"Generate a concise project status update (3-4 sentences) for:\n\n"
            f"Project: {project.name}\n"
            f"To Do: {todo}\n"
            f"In Progress: {in_progress}\n"
            f"Done: {done}\n\n"
            f"Be professional and highlight key risks or momentum."
        )
        summary = chat(client, prompt, max_tokens=300)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
