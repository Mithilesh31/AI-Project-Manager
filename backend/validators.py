import re

VALID_STATUSES   = {"todo", "in_progress", "done"}
VALID_PRIORITIES = {"low", "medium", "high"}
HEX_COLOR_RE     = re.compile(r'^#[0-9A-Fa-f]{6}$')


class ValidationError(Exception):
    def __init__(self, message, field=None):
        self.message = message
        self.field   = field
        super().__init__(message)


def validate_project(data, partial=False):
    if data is None:
        raise ValidationError("Request body must be JSON")

    cleaned = {}

    if not partial or "name" in data:
        name = data.get("name", "")
        if not isinstance(name, str) or not name.strip():
            raise ValidationError("Project name is required and must be a non-empty string", "name")
        if len(name.strip()) > 200:
            raise ValidationError("Project name must be 200 characters or fewer", "name")
        cleaned["name"] = name.strip()

    if "description" in data:
        desc = data.get("description", "")
        if not isinstance(desc, str):
            raise ValidationError("Description must be a string", "description")
        cleaned["description"] = desc[:2000]

    if "color" in data:
        color = data.get("color", "")
        if not isinstance(color, str) or not HEX_COLOR_RE.match(color):
            raise ValidationError("Color must be a valid hex code e.g. #6366f1", "color")
        cleaned["color"] = color

    return cleaned


def validate_task(data, partial=False):
    if data is None:
        raise ValidationError("Request body must be JSON")

    cleaned = {}

    if not partial or "title" in data:
        title = data.get("title", "")
        if not isinstance(title, str) or not title.strip():
            raise ValidationError("Task title is required and must be a non-empty string", "title")
        if len(title.strip()) > 500:
            raise ValidationError("Task title must be 500 characters or fewer", "title")
        cleaned["title"] = title.strip()

    if not partial:
        pid = data.get("project_id")
        if pid is None:
            raise ValidationError("project_id is required", "project_id")
        if not isinstance(pid, int) or pid <= 0:
            raise ValidationError("project_id must be a positive integer", "project_id")
        cleaned["project_id"] = pid

    if "description" in data:
        cleaned["description"] = str(data["description"])[:5000]

    if "status" in data:
        status = data.get("status")
        if status not in VALID_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(VALID_STATUSES))}", "status")
        cleaned["status"] = status

    if "priority" in data:
        priority = data.get("priority")
        if priority not in VALID_PRIORITIES:
            raise ValidationError(
                f"priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}", "priority")
        cleaned["priority"] = priority

    if "tags" in data:
        tags = data.get("tags")
        if not isinstance(tags, list):
            raise ValidationError("tags must be an array of strings", "tags")
        if len(tags) > 20:
            raise ValidationError("Maximum 20 tags per task", "tags")
        cleaned["tags"] = [str(t).strip().lower()[:50] for t in tags if str(t).strip()]

    if "due_date" in data:
        cleaned["due_date"] = data["due_date"]

    return cleaned