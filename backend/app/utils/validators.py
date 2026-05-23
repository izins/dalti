"""DALTI Backend — Input validation helpers."""

import re
from app.utils.errors import ValidationError


def validate_email(email: str) -> str:
    """Validate and return cleaned email."""
    if not email or not isinstance(email, str):
        raise ValidationError("Email is required")
    email = email.strip().lower()
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format")
    return email


def validate_password(password: str) -> str:
    """Validate password strength."""
    if not password or len(password) < 6:
        raise ValidationError("Password must be at least 6 characters")
    if len(password) > 128:
        raise ValidationError("Password too long")
    return password


def validate_required(data: dict, fields: list[str]) -> None:
    """Check that all required fields exist and are non-empty."""
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise ValidationError(f"Missing required fields: {', '.join(missing)}")


def validate_uuid(value: str, field_name: str = "id") -> str:
    """Validate UUID format."""
    pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    if not value or not re.match(pattern, value.lower()):
        raise ValidationError(f"Invalid UUID for {field_name}")
    return value.lower()
