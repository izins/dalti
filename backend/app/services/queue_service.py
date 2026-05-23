"""DALTI Backend — Queue management service.

Business logic for admin queue operations: call next, mark complete/missed, open/close.
"""

from datetime import datetime, timezone

from app.repositories.queue_repo import QueueRepository
from app.repositories.ticket_repo import TicketRepository
from app.utils.errors import NotFoundError, ConflictError
from app.utils.constants import TicketStatus, QueueStatus, AdminAction
from app.extensions import socketio


def _parse_iso_datetime(dt_str: str) -> datetime:
    """Parse an ISO 8601 datetime string robustly.

    Handles Supabase formats including:
      - 2026-05-04T22:01:39.123456+00:00
      - 2026-05-04T22:01:39Z
      - 2026-05-04T22:01:39+00:00

    Compatible with Python 3.10 and 3.11+.
    """
    if not dt_str:
        return datetime.now(timezone.utc)
    # Normalize: strip trailing Z, add UTC timezone
    s = dt_str.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(s)
    except (ValueError, TypeError):
        # Last resort: manual parse for edge cases
        try:
            # Remove microseconds if they cause issues
            if "." in s and "+" in s:
                base, tz = s.rsplit("+", 1)
                base = base.split(".")[0]
                s = f"{base}+{tz}"
            return datetime.fromisoformat(s)
        except (ValueError, TypeError):
            return datetime.now(timezone.utc)


def _log_admin_action(admin_id: str, ticket_id: str, action: str) -> None:
    """Log an admin action, gracefully handling failures.

    If the admin_actions table has FK constraints that fail
    (e.g., admin user not in users table), we still want the
    main operation to succeed.
    """
    try:
        from app.repositories.notification_repo import AdminActionRepository
        AdminActionRepository.create({
            "admin_id": admin_id,
            "ticket_id": ticket_id,
            "action": action,
        })
    except Exception as e:
        # Log but don't crash the main operation
        import logging
        logging.warning(f"Failed to log admin action {action} for ticket {ticket_id}: {e}")


class QueueService:
    """Queue management for admin/agent operations."""

    @staticmethod
    def call_next(queue_id: str, admin_id: str) -> dict:
        """Call the next person in the queue.

        1. Find the queue
        2. Get next waiting ticket (lowest number)
        3. Update ticket status to 'called'
        4. Update queue's last_called_number
        5. Log admin action
        """
        queue = QueueRepository.find_by_id(queue_id)
        if not queue:
            raise NotFoundError("Queue not found")

        if queue.get("status") != QueueStatus.OPEN:
            raise ConflictError("Queue is closed")

        # Find next waiting ticket (ordered by number)
        from app.extensions import get_supabase
        result = (
            get_supabase()
            .table("tickets")
            .select("*")
            .eq("queue_id", queue_id)
            .eq("status", TicketStatus.WAITING)
            .order("number")
            .limit(1)
            .execute()
        )

        if not result.data:
            raise NotFoundError("No one waiting in this queue")

        ticket = result.data[0]

        # Update ticket to called
        now = datetime.now(timezone.utc)
        updated = TicketRepository.update(ticket["id"], {
            "status": TicketStatus.CALLED,
            "called_at": now.isoformat(),
        })

        # Update queue
        QueueRepository.update(queue_id, {
            "last_called_number": ticket["number"],
        })

        # Log action (non-blocking)
        _log_admin_action(admin_id, ticket["id"], AdminAction.CALLED)

        # Build response
        response = updated if updated else ticket
        response["status"] = TicketStatus.CALLED
        response["called_at"] = now.isoformat()

        socketio.emit("queue_update", {"queue_id": queue_id})
        socketio.emit("ticket_called", {"ticket_id": ticket["id"], "queue_id": queue_id})

        return response

    @staticmethod
    def mark_completed(ticket_id: str, admin_id: str) -> dict:
        """Mark a ticket as completed."""
        # Use a simple select without deep joins to avoid nested data issues
        from app.extensions import get_supabase
        result = (
            get_supabase()
            .table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .maybe_single()
            .execute()
        )
        ticket = result.data
        if not ticket:
            raise NotFoundError("Ticket not found")

        if ticket.get("status") != TicketStatus.CALLED:
            raise ConflictError(f"Only called tickets can be completed (current: {ticket.get('status')})")

        now = datetime.now(timezone.utc)

        # Calculate actual wait time safely
        actual_wait = 0
        try:
            created_at = _parse_iso_datetime(ticket.get("created_at", ""))
            actual_wait = max(0, int((now - created_at).total_seconds() / 60))
        except Exception:
            actual_wait = 0

        updated = TicketRepository.update(ticket_id, {
            "status": TicketStatus.COMPLETED,
            "completed_at": now.isoformat(),
            "actual_wait_time": actual_wait,
        })

        # Log action (non-blocking)
        _log_admin_action(admin_id, ticket_id, AdminAction.COMPLETED)

        # Emit update using the raw queue_id from the flat ticket
        queue_id = ticket.get("queue_id")
        if queue_id:
            socketio.emit("queue_update", {"queue_id": queue_id})

        return updated if updated else {"id": ticket_id, "status": TicketStatus.COMPLETED}

    @staticmethod
    def mark_missed(ticket_id: str, admin_id: str) -> dict:
        """Mark a ticket as missed (person didn't show up)."""
        # Use a simple select without deep joins
        from app.extensions import get_supabase
        result = (
            get_supabase()
            .table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .maybe_single()
            .execute()
        )
        ticket = result.data
        if not ticket:
            raise NotFoundError("Ticket not found")

        if ticket.get("status") != TicketStatus.CALLED:
            raise ConflictError("Only called tickets can be marked as missed")

        updated = TicketRepository.update(ticket_id, {
            "status": TicketStatus.MISSED,
        })

        # Log action (non-blocking)
        _log_admin_action(admin_id, ticket_id, AdminAction.MISSED)

        queue_id = ticket.get("queue_id")
        if queue_id:
            socketio.emit("queue_update", {"queue_id": queue_id})

        return updated if updated else {"id": ticket_id, "status": TicketStatus.MISSED}

    @staticmethod
    def toggle_queue_status(queue_id: str, status: str) -> dict:
        """Open or close a queue."""
        if status not in (QueueStatus.OPEN, QueueStatus.CLOSED):
            raise ConflictError(f"Invalid status: {status}")

        queue = QueueRepository.find_by_id(queue_id)
        if not queue:
            raise NotFoundError("Queue not found")
        updated = QueueRepository.update(queue_id, {"status": status})
        socketio.emit("queue_update", {"queue_id": queue_id})
        return updated

    @staticmethod
    def get_queue_status(queue_id: str) -> dict:
        """Get current queue status with counts."""
        queue = QueueRepository.find_by_id(queue_id)
        if not queue:
            raise NotFoundError("Queue not found")

        waiting = TicketRepository.count_waiting_in_queue(queue_id)
        queue["waiting_count"] = waiting
        return queue
