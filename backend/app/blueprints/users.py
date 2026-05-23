"""DALTI Backend — Users blueprint (profile management)."""

from flask import Blueprint, request, jsonify, g
from app.repositories.user_repo import UserRepository
from app.repositories.notification_repo import NotificationRepository
from app.middleware.auth import auth_required

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("/me", methods=["GET"])
@auth_required
def get_profile():
    """Get current user profile."""
    user = UserRepository.find_by_id(g.current_user["id"])
    if user:
        user.pop("password_hash", None)
        user.pop("passeword_hash", None)
    return jsonify({"user": user}), 200


@users_bp.route("/me", methods=["PUT"])
@auth_required
def update_profile():
    """Update current user profile."""
    data = request.get_json(silent=True) or {}
    allowed = {"first_name", "last_name", "birth_date", "wilaya", "commune"}
    update_data = {k: v for k, v in data.items() if k in allowed and v is not None}
    if not update_data:
        return jsonify({"error": "No valid fields to update", "code": "VALIDATION_ERROR"}), 422
    user = UserRepository.update(g.current_user["id"], update_data)
    user.pop("password_hash", None)
    user.pop("passeword_hash", None)
    return jsonify({"user": user, "message": "Profile updated"}), 200


@users_bp.route("/notifications", methods=["GET"])
@auth_required
def get_notifications():
    """Get notifications for the logged in user."""
    notifications = NotificationRepository.find_by_user(g.current_user["id"])
    return jsonify({"notifications": notifications}), 200
