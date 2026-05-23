"""DALTI Backend — Tickets blueprint."""

from flask import Blueprint, request, jsonify, g
from app.services.ticket_service import TicketService
from app.middleware.auth import auth_required, admin_required
from app.utils.validators import validate_uuid

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")


@tickets_bp.route("", methods=["POST"])
@auth_required
def take_ticket():
    """Take a new ticket."""
    data = request.get_json(silent=True) or {}
    
    structure_id = data.get("structure_id", "")
    service_id = data.get("service_id", "")
    
    if not structure_id or not service_id:
        return jsonify({
            "error": "structure_id and service_id are required",
            "code": "VALIDATION_ERROR"
        }), 422
    
    validate_uuid(structure_id, "structure_id")
    validate_uuid(service_id, "service_id")
    
    try:
        ticket = TicketService.take_ticket(
            user_id=g.current_user["id"],
            structure_id=structure_id,
            service_id=service_id,
        )
        return jsonify({"ticket": ticket}), 201
    except Exception as e:
        from app.utils.errors import APIError
        if isinstance(e, APIError):
            raise  # Let error handler deal with known errors
        import logging
        logging.exception(f"take_ticket failed: {e}")
        return jsonify({"error": str(e), "code": "INTERNAL_ERROR"}), 500


@tickets_bp.route("/mine", methods=["GET"])
@auth_required
def my_tickets():
    """Get active tickets for current user."""
    tickets = TicketService.get_user_tickets(g.current_user["id"])
    return jsonify({"tickets": tickets}), 200


@tickets_bp.route("/history", methods=["GET"])
@auth_required
def ticket_history():
    """Get ticket history for current user."""
    tickets = TicketService.get_user_history(g.current_user["id"])
    return jsonify({"tickets": tickets}), 200


@tickets_bp.route("/<ticket_id>", methods=["GET"])
@auth_required
def get_ticket(ticket_id: str):
    """Get ticket details."""
    from app.repositories.ticket_repo import TicketRepository
    ticket = TicketRepository.find_by_id(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found", "code": "NOT_FOUND"}), 404
    return jsonify({"ticket": ticket}), 200


@tickets_bp.route("/<ticket_id>/cancel", methods=["PUT"])
@auth_required
def cancel_ticket(ticket_id: str):
    """Cancel own ticket."""
    result = TicketService.cancel_ticket(ticket_id, g.current_user["id"])
    return jsonify({"ticket": result, "message": "Ticket cancelled"}), 200


@tickets_bp.route("/qr/<code>", methods=["GET"])
@admin_required
def lookup_by_qr(code: str):
    """Lookup ticket by QR code (admin only)."""
    ticket = TicketService.get_ticket_by_qr(code)
    return jsonify({"ticket": ticket}), 200
