"""DALTI Backend — Notification repository."""

from app.extensions import get_supabase


class NotificationRepository:
    """Data access for notifications table."""

    TABLE = "notifications"

    @staticmethod
    def create(data: dict) -> dict:
        result = get_supabase().table(NotificationRepository.TABLE).insert(data).execute()
        return result.data[0]

    @staticmethod
    def find_unsent_due() -> list[dict]:
        """Find notifications that are due but not yet sent."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        result = (
            get_supabase()
            .table(NotificationRepository.TABLE)
            .select("*, users(email, first_name), tickets(number, queues(services(name), structures(name)))")
            .eq("is_sent", False)
            .lte("scheduled_at", now)
            .order("scheduled_at")
            .limit(50)
            .execute()
        )
        return result.data or []

    @staticmethod
    def find_by_user(user_id: str, limit: int = 20) -> list[dict]:
        """Get notifications for a specific user."""
        result = (
            get_supabase()
            .table(NotificationRepository.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    @staticmethod
    def mark_sent(notification_id: str) -> None:
        from datetime import datetime, timezone
        get_supabase().table(NotificationRepository.TABLE).update({
            "is_sent": True,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", notification_id).execute()


class AdminActionRepository:
    """Data access for admin_actions table."""

    TABLE = "admin_actions"

    @staticmethod
    def create(data: dict) -> dict:
        result = get_supabase().table(AdminActionRepository.TABLE).insert(data).execute()
        return result.data[0]

    @staticmethod
    def find_by_ticket(ticket_id: str) -> list[dict]:
        result = (
            get_supabase()
            .table(AdminActionRepository.TABLE)
            .select("*, users(first_name, last_name)")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
