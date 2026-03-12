import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///taskflow.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = os.getenv("TESTING", "false").lower() == "true"

    CORS(app, origins="*", supports_credentials=True)
    db.init_app(app)

    # Logging
    from backend.logger import setup_logging
    setup_logging(app)

    from backend.routes.projects import projects_bp
    from backend.routes.tasks import tasks_bp
    from backend.routes.ai import ai_bp

    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(tasks_bp,    url_prefix="/api/tasks")
    app.register_blueprint(ai_bp,       url_prefix="/api/ai")

    # Global error handlers — observability
    from backend.validators import ValidationError

    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        app.logger.warning("Validation error: %s (field=%s)", e.message, e.field)
        return jsonify({"error": e.message, "field": e.field}), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        app.logger.info("404: %s", str(e))
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        app.logger.error("500 Internal Server Error: %s", str(e))
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()

    app.logger.info("TaskFlow started — DB: %s", app.config["SQLALCHEMY_DATABASE_URI"])
    return app