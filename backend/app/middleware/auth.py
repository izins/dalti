"""DALTI Backend — JWT authentication middleware.

Provides decorators for protecting routes with JWT tokens and role-based access.
"""

import jwt
from functools import wraps
from flask import request, g, current_app
from app.utils.errors import AuthError, ForbiddenError
from app.utils.constants import UserRole


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=["HS256"],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthError("Invalid token")


def get_token_from_header() -> str:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise AuthError("Missing or malformed Authorization header")
    return auth_header[7:]


def auth_required(f):
    """Decorator: require a valid JWT access token.

    Sets g.current_user with decoded payload:
        - sub: user UUID
        - email: user email
        - role: user role (user/admin/agent)
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        payload = decode_token(token)

        if payload.get("type") != "access":
            raise AuthError("Invalid token type")

        g.current_user = {
            "id": payload["sub"],
            "email": payload.get("email", ""),
            "role": payload.get("role", UserRole.USER),
            "is_admin": payload.get("is_admin", False),
        }
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator: require admin or agent role."""
    @wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        user = g.current_user
        if user["role"] not in UserRole.STAFF and not user["is_admin"]:
            raise ForbiddenError("Admin or agent access required")
        return f(*args, **kwargs)
    return decorated


def refresh_token_required(f):
    """Decorator: require a valid JWT refresh token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        payload = decode_token(token)

        if payload.get("type") != "refresh":
            raise AuthError("Invalid token type — refresh token required")

        g.current_user = {
            "id": payload["sub"],
            "email": payload.get("email", ""),
        }
        return f(*args, **kwargs)
    return decorated
