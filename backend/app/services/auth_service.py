"""DALTI Backend — Auth service.

Handles registration, login, token generation, and refresh logic.
"""

import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from flask import current_app

from app.repositories.user_repo import UserRepository
from app.utils.errors import AuthError, ConflictError, ValidationError
from app.utils.validators import validate_email, validate_password, validate_required


class AuthService:
    """Authentication business logic."""

    @staticmethod
    def register(data: dict) -> dict:
        """Register a new user account.

        Args:
            data: Dict with email, password, first_name, last_name, etc.

        Returns:
            Created user record (without password_hash).
        """
        validate_required(data, ["email", "password", "first_name"])
        email = validate_email(data["email"])
        password = validate_password(data["password"])

        # Check uniqueness
        existing = UserRepository.find_by_email(email)
        if existing:
            raise ConflictError("An account with this email already exists")

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user = UserRepository.create({
            "email": email,
            "password_hash": password_hash,
            "first_name": data["first_name"].strip(),
            "last_name": data.get("last_name", "").strip(),
            "birth_date": data.get("birth_date") or None,
            "wilaya": data.get("wilaya") or None,
            "commune": data.get("commune") or None,
            "is_admin": False,
        })

        # Remove hash from response
        user.pop("password_hash", None)
        return user

    @staticmethod
    def login(email: str, password: str) -> dict:
        """Authenticate user and return token pair.

        Returns:
            Dict with access_token, refresh_token, and user info.
        """
        email = validate_email(email)
        if not password:
            raise ValidationError("Password is required")

        user = UserRepository.find_by_email(email)
        if not user:
            raise AuthError("Invalid email or password")

        # Verify password
        stored_hash = user.get("password", "") or user.get("password_hash", "")
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            raise AuthError("Invalid email or password")

        # Generate tokens
        access_token = AuthService._generate_token(user, "access")
        refresh_token = AuthService._generate_token(user, "refresh")

        # Clean user for response
        safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "password")}

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": safe_user,
        }

    @staticmethod
    def refresh(user_id: str) -> dict:
        """Issue a new access token from a valid refresh token.

        Args:
            user_id: Extracted from the refresh token payload.

        Returns:
            Dict with new access_token.
        """
        user = UserRepository.find_by_id(user_id)
        if not user:
            raise AuthError("User not found")

        access_token = AuthService._generate_token(user, "access")
        return {"access_token": access_token}

    @staticmethod
    def _generate_token(user: dict, token_type: str) -> str:
        """Generate a JWT token.

        Args:
            user: User record from DB.
            token_type: 'access' or 'refresh'.

        Returns:
            Encoded JWT string.
        """
        config = current_app.config
        now = datetime.now(timezone.utc)

        if token_type == "access":
            expires = now + timedelta(seconds=config["JWT_ACCESS_TOKEN_EXPIRES"])
        else:
            expires = now + timedelta(seconds=config["JWT_REFRESH_TOKEN_EXPIRES"])

        payload = {
            "sub": user["id"],
            "email": user["email"],
            "role": "admin" if user.get("is_admin") else "user",
            "is_admin": bool(user.get("is_admin")),
            "type": token_type,
            "iat": now,
            "exp": expires,
        }

        return jwt.encode(payload, config["JWT_SECRET_KEY"], algorithm="HS256")
