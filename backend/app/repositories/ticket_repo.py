"""DALTI Backend — Ticket repository.

Database operations for the tickets table.
"""

from typing import Optional
from app.extensions import get_supabase


class TicketRepository:
    """Data access layer for tickets."""

    TABLE = "tickets"

    @staticmethod
    def create(data: dict) -> dict:
        """Insert a new ticket."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .insert(data)
            .execute()
        )
        return result.data[0]

    @staticmethod
    def find_by_id(ticket_id: str) -> Optional[dict]:
        """Find ticket by UUID."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, queues(*, structures(name), services(name))")
            .eq("id", ticket_id)
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def find_by_qr_code(qr_code: str) -> Optional[dict]:
        """Find ticket by unique QR code string."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, queues(*, structures(name), services(name)), users(first_name, last_name, email)")
            .eq("qr_code", qr_code)
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def find_active_by_user(user_id: str) -> list[dict]:
        """Get user's active (waiting/called) tickets."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, queues(*, structures(name), services(name))")
            .eq("user_id", user_id)
            .in_("status", ["waiting", "called"])
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    @staticmethod
    def find_history_by_user(user_id: str, limit: int = 50) -> list[dict]:
        """Get user's past tickets (completed, missed, cancelled)."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, queues(*, structures(name), services(name))")
            .eq("user_id", user_id)
            .in_("status", ["completed", "missed", "cancelled"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    @staticmethod
    def update(ticket_id: str, data: dict) -> dict:
        """Update ticket fields."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .update(data)
            .eq("id", ticket_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    @staticmethod
    def get_recent_wait_times(queue_id: str, limit: int = 10) -> list[int]:
        """Get the last N actual_wait_time values for a queue (for smart algorithm)."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("actual_wait_time")
            .eq("queue_id", queue_id)
            .eq("status", "completed")
            .not_.is_("actual_wait_time", "null")
            .gt("actual_wait_time", 0)
            .order("completed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [r["actual_wait_time"] for r in (result.data or [])]

    @staticmethod
    def count_waiting_in_queue(queue_id: str) -> int:
        """Count tickets with 'waiting' status in a queue."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("id", count="exact")
            .eq("queue_id", queue_id)
            .eq("status", "waiting")
            .execute()
        )
        return result.count or 0

    @staticmethod
    def find_waiting_in_queue(queue_id: str) -> list[dict]:
        """Find all waiting tickets in a specific queue."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, users(first_name, last_name)")
            .eq("queue_id", queue_id)
            .eq("status", "waiting")
            .order("number")
            .execute()
        )
        return result.data or []

    @staticmethod
    def find_called_in_queue(queue_id: str) -> Optional[dict]:
        """Find the currently called ticket in a queue."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("*, users(first_name, last_name)")
            .eq("queue_id", queue_id)
            .eq("status", "called")
            .order("called_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    @staticmethod
    def get_next_number(queue_id: str) -> int:
        """Get the next ticket number for a queue (max number + 1)."""
        result = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("number")
            .eq("queue_id", queue_id)
            .order("number", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["number"] + 1
        return 1

    @staticmethod
    def get_queue_stats(queue_id: str) -> dict:
        """Get detailed statistics for a queue."""
        # People waiting
        waiting = TicketRepository.count_waiting_in_queue(queue_id)
        
        # Served today (assuming all completed/missed are today for simplicity in this mockup context)
        served_res = (
            get_supabase()
            .table(TicketRepository.TABLE)
            .select("id", count="exact")
            .eq("queue_id", queue_id)
            .in_("status", ["completed", "missed"])
            .execute()
        )
        served = served_res.count or 0
        
        # Average wait time
        wait_times = TicketRepository.get_recent_wait_times(queue_id, limit=20)
        avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0
        
        return {
            "waiting_count": waiting,
            "served_count": served,
            "avg_wait_time": round(avg_wait, 1)
        }
