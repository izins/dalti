"""DALTI Backend — User repository.

Database operations for the users table via Supabase REST API.
"""

from typing import Optional
from app.extensions import get_supabase


class UserRepository:
    """Data access layer for the users table."""

    TABLE = "users"

    @staticmethod
    def find_by_email(email: str) -> Optional[dict]:
        """Find a user by email."""
        result = (
            get_supabase()
            .table(UserRepository.TABLE)
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        return result.data if result and hasattr(result, 'data') else (result if isinstance(result, dict) else None)

    @staticmethod
    def find_by_id(user_id: str) -> Optional[dict]:
        """Find a user by UUID."""
        result = (
            get_supabase()
            .table(UserRepository.TABLE)
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return result.data if result and hasattr(result, 'data') else (result if isinstance(result, dict) else None)

    @staticmethod
    def create(data: dict) -> dict:
        """Insert a new user and return the created record."""
        result = (
            get_supabase()
            .table(UserRepository.TABLE)
            .insert(data)
            .execute()
        )
        return result.data[0]

    @staticmethod
    def update(user_id: str, data: dict) -> dict:
        """Update user fields."""
        result = (
            get_supabase()
            .table(UserRepository.TABLE)
            .update(data)
            .eq("id", user_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    @staticmethod
    def get_role_for_structure(user_id: str, structure_id: str) -> Optional[str]:
        """Get the user's role for a specific structure from user_structures."""
        result = (
            get_supabase()
            .table("user_structures")
            .select("role")
            .eq("user_id", user_id)
            .eq("structure_id", structure_id)
            .maybe_single()
            .execute()
        )
        data = result.data if result and hasattr(result, 'data') else (result if isinstance(result, dict) else None)
        return data["role"] if data else None
