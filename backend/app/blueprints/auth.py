"""DALTI Backend — Auth blueprint."""

from flask import Blueprint, request, jsonify, g
from app.services.auth_service import AuthService
from app.middleware.auth import auth_required, refresh_token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json(silent=True) or {}
    user = AuthService.register(data)
    return jsonify({"user": user, "message": "Registration successful"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user, return JWT pair."""
    data = request.get_json(silent=True) or {}
    result = AuthService.login(data.get("email", ""), data.get("password", ""))
    return jsonify(result), 200


@auth_bp.route("/refresh", methods=["POST"])
@refresh_token_required
def refresh():
    """Refresh access token using a valid refresh token."""
    result = AuthService.refresh(g.current_user["id"])
    return jsonify(result), 200


@auth_bp.route("/logout", methods=["POST"])
@auth_required
def logout():
    """Logout (client-side token discard)."""
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@auth_required
def me():
    """Get current user from token."""
    from app.repositories.user_repo import UserRepository
    user = UserRepository.find_by_id(g.current_user["id"])
    if user:
        user.pop("password_hash", None)
        user.pop("passeword_hash", None)
    return jsonify({"user": user}), 200
