"""DALTI Backend — Queue repository."""

from typing import Optional
from app.extensions import get_supabase


class QueueRepository:
    """Data access layer for queues."""

    TABLE = "queues"

    @staticmethod
    def find_by_id(queue_id: str) -> Optional[dict]:
        """Get queue by ID with structure and service names."""
        result = (
            get_supabase()
            .table(QueueRepository.TABLE)
            .select("*, structures(name, wilaya), services(name, icon)")
            .eq("id", queue_id)
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def find_by_structure(structure_id: str) -> list[dict]:
        """Get all queues for a structure."""
        result = (
            get_supabase()
            .table(QueueRepository.TABLE)
            .select("*, services(name, icon)")
            .eq("structure_id", structure_id)
            .execute()
        )
        return result.data or []

    @staticmethod
    def find_open_queue(structure_id: str, service_id: str) -> Optional[dict]:
        """Find an open queue for a specific structure + service."""
        result = (
            get_supabase()
            .table(QueueRepository.TABLE)
            .select("*")
            .eq("structure_id", structure_id)
            .eq("service_id", service_id)
            .eq("status", "open")
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def update(queue_id: str, data: dict) -> dict:
        """Update queue fields."""
        result = (
            get_supabase()
            .table(QueueRepository.TABLE)
            .update(data)
            .eq("id", queue_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    @staticmethod
    def increment_total_today(queue_id: str) -> None:
        """Increment total_today counter using RPC or manual fetch+update."""
        queue = QueueRepository.find_by_id(queue_id)
        if queue:
            current = queue.get("total_today", 0) or 0
            QueueRepository.update(queue_id, {"total_today": current + 1})
