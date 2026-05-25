"""DALTI Backend — Notification service with background scheduler."""

from datetime import datetime, timezone
from flask_mail import Message
from app.extensions import mail
from app.repositories.notification_repo import NotificationRepository


class NotificationService:
    """Email notification logic + scheduler job."""

    @staticmethod
    def process_pending_notifications() -> int:
        """Process all due, unsent notifications. Called by APScheduler."""
        due = NotificationRepository.find_unsent_due()
        sent_count = 0
        for notif in due:
            try:
                NotificationService._send_email(notif)
                NotificationRepository.mark_sent(notif["id"])
                sent_count += 1
            except Exception as e:
                print(f"[NOTIFICATION ERROR] {notif['id']}: {e}")
        return sent_count

    @staticmethod
    def _send_email(notif: dict) -> None:
        """Send a single notification email."""
        user = notif.get("users", {})
        email = user.get("email")
        if not email:
            return
        name = user.get("first_name", "User")
        ticket_info = notif.get("tickets", {})
        ticket_num = ticket_info.get("number", "?")
        queue_info = ticket_info.get("queues", {})
        service_name = queue_info.get("services", {}).get("name", "")
        structure_name = queue_info.get("structures", {}).get("name", "")

        subject = f"DALTI - Your turn is approaching! Ticket #{ticket_num}"
        body = (
            f"Hello {name},\n\n"
            f"Your turn at {structure_name} ({service_name}) is approaching.\n"
            f"Ticket #{ticket_num} - Please be ready!\n\n"
            f"— DALTI Queue Management"
        )
        msg = Message(subject=subject, recipients=[email], body=body)
        mail.send(msg)
