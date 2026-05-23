"""DALTI Backend — Admin blueprint."""

from flask import Blueprint, request, jsonify, g
from app.services.queue_service import QueueService
from app.middleware.auth import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/call-next", methods=["POST"])
@admin_required
def call_next():
    """Call next person in queue."""
    data = request.get_json(silent=True) or {}
    queue_id = data.get("queue_id", "")
    if not queue_id:
        return jsonify({"error": "queue_id is required", "code": "VALIDATION_ERROR"}), 422
    try:
        ticket = QueueService.call_next(queue_id, g.current_user["id"])
        return jsonify({"ticket": ticket, "message": "Next person called"}), 200
    except Exception as e:
        from app.utils.errors import APIError
        if isinstance(e, APIError):
            raise
        import logging
        logging.exception(f"call_next failed: {e}")
        return jsonify({"error": str(e), "code": "INTERNAL_ERROR"}), 500


@admin_bp.route("/complete/<ticket_id>", methods=["POST"])
@admin_required
def complete_ticket(ticket_id: str):
    """Mark ticket as completed."""
    try:
        result = QueueService.mark_completed(ticket_id, g.current_user["id"])
        return jsonify({"ticket": result, "message": "Ticket completed"}), 200
    except Exception as e:
        from app.utils.errors import APIError
        if isinstance(e, APIError):
            raise
        import logging
        logging.exception(f"complete_ticket failed: {e}")
        return jsonify({"error": str(e), "code": "INTERNAL_ERROR"}), 500


@admin_bp.route("/missed/<ticket_id>", methods=["POST"])
@admin_required
def miss_ticket(ticket_id: str):
    """Mark ticket as missed."""
    try:
        result = QueueService.mark_missed(ticket_id, g.current_user["id"])
        return jsonify({"ticket": result, "message": "Ticket marked as missed"}), 200
    except Exception as e:
        from app.utils.errors import APIError
        if isinstance(e, APIError):
            raise
        import logging
        logging.exception(f"miss_ticket failed: {e}")
        return jsonify({"error": str(e), "code": "INTERNAL_ERROR"}), 500


@admin_bp.route("/history/<structure_id>", methods=["GET"])
@admin_required
def admin_history(structure_id: str):
    """Get ticket history for a structure — all processed tickets with admin actions."""
    try:
        from app.extensions import get_supabase
        from app.repositories.queue_repo import QueueRepository

        # Get all queues for this structure
        queues = QueueRepository.find_by_structure(structure_id)
        queue_ids = [q["id"] for q in queues]

        if not queue_ids:
            return jsonify({"tickets": [], "actions": []}), 200

        # Get all non-waiting tickets for these queues (processed tickets)
        tickets_result = (
            get_supabase()
            .table("tickets")
            .select("*, users(first_name, last_name, email), queues(*, services(name, icon))")
            .in_("queue_id", queue_ids)
            .in_("status", ["called", "completed", "missed", "cancelled"])
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        tickets = tickets_result.data or []

        # Get admin actions for these tickets
        ticket_ids = [t["id"] for t in tickets]
        actions = []
        if ticket_ids:
            actions_result = (
                get_supabase()
                .table("admin_actions")
                .select("*, users(first_name, last_name)")
                .in_("ticket_id", ticket_ids)
                .order("created_at", desc=True)
                .execute()
            )
            actions = actions_result.data or []

        return jsonify({"tickets": tickets, "actions": actions}), 200
    except Exception as e:
        import logging
        logging.exception(f"admin_history failed: {e}")
        return jsonify({"error": str(e), "code": "INTERNAL_ERROR"}), 500

