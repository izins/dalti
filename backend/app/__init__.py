"""DALTI Backend — Flask application factory.

Creates and configures the Flask app with all blueprints, extensions, and error handlers.
"""

import logging
from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.extensions import mail, scheduler, init_supabase, socketio
from app.utils.errors import register_error_handlers


def create_app() -> Flask:
    """Application factory pattern."""
    config = get_config()
    app = Flask(__name__)
    app.config.from_object(config)

    # Logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    # CORS
    CORS(app, origins=[config.FRONTEND_URL], supports_credentials=True)

    # Initialize Supabase
    init_supabase(config.SUPABASE_URL, config.SUPABASE_KEY)

    # Initialize extensions
    mail.init_app(app)
    socketio.init_app(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    from app.blueprints.auth import auth_bp
    from app.blueprints.tickets import tickets_bp
    from app.blueprints.queues import queues_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.exchanges import exchanges_bp
    from app.blueprints.structures import structures_bp
    from app.blueprints.users import users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(queues_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(exchanges_bp)
    app.register_blueprint(structures_bp)
    app.register_blueprint(users_bp)

    # Background scheduler for notifications
    scheduler.init_app(app)

    @scheduler.task("interval", id="process_notifications", seconds=60, misfire_grace_time=30)
    def process_notifications():
        with app.app_context():
            from app.services.notification_service import NotificationService
            count = NotificationService.process_pending_notifications()
            if count > 0:
                app.logger.info(f"Sent {count} notification(s)")

    scheduler.start()

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "dalti-api"}, 200

    app.logger.info("DALTI API initialized successfully")
    return app
