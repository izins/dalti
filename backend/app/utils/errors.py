"""DALTI Backend — Unified error handling."""

from flask import jsonify
from typing import Any


class APIError(Exception):
    """Base API error with HTTP status code and error code."""

    def __init__(self, message: str, code: str = "UNKNOWN_ERROR", status: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status

    def to_dict(self) -> dict[str, Any]:
        return {"error": self.message, "code": self.code}


class NotFoundError(APIError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, "NOT_FOUND", 404)


class AuthError(APIError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, "AUTH_REQUIRED", 401)


class ForbiddenError(APIError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "FORBIDDEN", 403)


class ValidationError(APIError):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, "VALIDATION_ERROR", 422)


class ConflictError(APIError):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, "CONFLICT", 409)


def register_error_handlers(app):
    """Register global error handlers on the Flask app."""

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        return jsonify(error.to_dict()), error.status

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({"error": "Not found", "code": "NOT_FOUND"}), 404

    @app.errorhandler(500)
    def handle_500(error):
        return jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}), 500
