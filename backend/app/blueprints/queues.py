"""DALTI Backend — Queues blueprint."""

from flask import Blueprint, jsonify, g
from app.services.queue_service import QueueService
from app.repositories.queue_repo import QueueRepository
from app.middleware.auth import admin_required

queues_bp = Blueprint("queues", __name__, url_prefix="/api/queues")


@queues_bp.route("/<queue_id>", methods=["GET"])
def get_queue(queue_id: str):
    """Get queue status."""
    queue = QueueService.get_queue_status(queue_id)
    return jsonify({"queue": queue}), 200


@queues_bp.route("/structure/<structure_id>", methods=["GET"])
def get_structure_queues(structure_id: str):
    """Get all queues for a structure with real ticket data."""
    queues = QueueRepository.find_by_structure(structure_id)
    from app.repositories.ticket_repo import TicketRepository
    for q in queues:
        q["waiting_count"] = TicketRepository.count_waiting_in_queue(q["id"])
        q["called_ticket"] = TicketRepository.find_called_in_queue(q["id"])
        q["waiting_tickets"] = TicketRepository.find_waiting_in_queue(q["id"])
    return jsonify({"queues": queues}), 200


@queues_bp.route("/<queue_id>/status", methods=["PUT"])
@admin_required
def toggle_status(queue_id: str):
    """Open or close a queue."""
    from flask import request
    data = request.get_json(silent=True) or {}
    status = data.get("status", "")
    result = QueueService.toggle_queue_status(queue_id, status)
    return jsonify({"queue": result}), 200
