"""DALTI Backend — Exchange repository."""

from typing import Optional
from app.extensions import get_supabase


class ExchangeRepository:
    """Data access for ticket_exchange table."""

    TABLE = "ticket_exchange"

    @staticmethod
    def create(data: dict) -> dict:
        result = get_supabase().table(ExchangeRepository.TABLE).insert(data).execute()
        return result.data[0]

    @staticmethod
    def find_by_id(exchange_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(ExchangeRepository.TABLE)
            .select("*, owner:tickets!ticket_exchange_ticket_owner_id_fkey(*), target:tickets!ticket_exchange_ticket_target_id_fkey(*)")
            .eq("id", exchange_id)
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def find_pending_for_user(user_id: str) -> list[dict]:
        """Find pending exchanges where user's ticket is the target."""
        result = (
            get_supabase()
            .table(ExchangeRepository.TABLE)
            .select("*, owner:tickets!ticket_exchange_ticket_owner_id_fkey(*, users(first_name, last_name)), target:tickets!ticket_exchange_ticket_target_id_fkey(*)")
            .eq("status", "pending")
            .execute()
        )
        # Filter in app layer since we need to check ticket ownership
        exchanges = []
        for ex in (result.data or []):
            if ex.get("target", {}).get("user_id") == user_id:
                exchanges.append(ex)
        return exchanges

    @staticmethod
    def find_by_user(user_id: str) -> list[dict]:
        """Find all exchanges initiated by a user."""
        result = (
            get_supabase()
            .table(ExchangeRepository.TABLE)
            .select("*, owner:tickets!ticket_exchange_ticket_owner_id_fkey(*), target:tickets!ticket_exchange_ticket_target_id_fkey(*)")
            .execute()
        )
        exchanges = []
        for ex in (result.data or []):
            if ex.get("owner", {}).get("user_id") == user_id:
                exchanges.append(ex)
        return exchanges

    @staticmethod
    def update(exchange_id: str, data: dict) -> dict:
        result = (
            get_supabase()
            .table(ExchangeRepository.TABLE)
            .update(data)
            .eq("id", exchange_id)
            .execute()
        )
        return result.data[0] if result.data else {}
