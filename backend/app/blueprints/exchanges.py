"""DALTI Backend — Exchanges blueprint."""

from flask import Blueprint, request, jsonify, g
from app.services.exchange_service import ExchangeService
from app.middleware.auth import auth_required

exchanges_bp = Blueprint("exchanges", __name__, url_prefix="/api/exchanges")


@exchanges_bp.route("", methods=["POST"])
@auth_required
def propose():
    """Propose a ticket exchange."""
    data = request.get_json(silent=True) or {}
    result = ExchangeService.propose_exchange(
        owner_ticket_id=data.get("owner_ticket_id", ""),
        target_ticket_id=data.get("target_ticket_id", ""),
        user_id=g.current_user["id"],
    )
    return jsonify({"exchange": result}), 201


@exchanges_bp.route("/<exchange_id>/accept", methods=["PUT"])
@auth_required
def accept(exchange_id: str):
    """Accept a pending exchange."""
    result = ExchangeService.accept_exchange(exchange_id, g.current_user["id"])
    return jsonify(result), 200


@exchanges_bp.route("/<exchange_id>/reject", methods=["PUT"])
@auth_required
def reject(exchange_id: str):
    """Reject/cancel a pending exchange."""
    result = ExchangeService.reject_exchange(exchange_id, g.current_user["id"])
    return jsonify(result), 200


@exchanges_bp.route("/mine", methods=["GET"])
@auth_required
def my_exchanges():
    """Get incoming and outgoing exchanges."""
    result = ExchangeService.get_user_exchanges(g.current_user["id"])
    return jsonify(result), 200


@exchanges_bp.route("/discover", methods=["GET"])
@auth_required
def discover():
    """Discover potential exchange partners."""
    partners = ExchangeService.discover_partners(g.current_user["id"])
    return jsonify({"partners": partners}), 200
