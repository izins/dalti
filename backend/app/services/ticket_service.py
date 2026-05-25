"""DALTI Backend — Ticket service.

Business logic for ticket creation, cancellation, and lifecycle management.
"""

from datetime import datetime, timezone, timedelta

from app.repositories.ticket_repo import TicketRepository
from app.repositories.queue_repo import QueueRepository
from app.repositories.notification_repo import NotificationRepository
from app.services.qr_service import QRService
from app.services.wait_time_service import WaitTimeService
from app.utils.errors import NotFoundError, ConflictError, ForbiddenError, ValidationError
from app.utils.constants import TicketStatus, QueueStatus
from app.extensions import socketio


class TicketService:
    """Ticket lifecycle management."""

    @staticmethod
    def take_ticket(user_id: str, structure_id: str, service_id: str) -> dict:
        """Create a new ticket for a user.

        1. Verify queue exists and is open
        2. Check user doesn't already have active ticket in this queue
        3. Generate ticket number and QR code
        4. Calculate estimated wait time
        5. Schedule notification
        """
        # Find the open queue
        queue = QueueRepository.find_open_queue(structure_id, service_id)
        if not queue:
            raise NotFoundError("No open queue found for this service at this structure")

        # Check for existing active ticket
        active_tickets = TicketRepository.find_active_by_user(user_id)
        for ticket in active_tickets:
            if ticket.get("queue_id") == queue["id"]:
                raise ConflictError("You already have an active ticket in this queue")

        # Generate ticket number and QR
        ticket_number = TicketRepository.get_next_number(queue["id"])
        qr_code, qr_image = QRService.generate()

        # Calculate position and estimated wait
        position = TicketRepository.count_waiting_in_queue(queue["id"]) + 1
        wait_data = WaitTimeService.calculate_with_velocity(queue["id"], position)
        estimated_minutes = wait_data["estimated_minutes"]

        # Create ticket
        # DB schema (post-migration): called_at/completed_at are timestamptz NULL
        ticket = TicketRepository.create({
            "user_id": user_id,
            "queue_id": queue["id"],
            "number": ticket_number,
            "status": TicketStatus.WAITING,
            "qr_code": qr_code,
            "estimated_time": estimated_minutes,
        })

        # Update queue counters
        QueueRepository.update(queue["id"], {
            "current_number": ticket_number,
        })
        QueueRepository.increment_total_today(queue["id"])

        # Schedule notification (15 min before estimated turn)
        if estimated_minutes > 15:
            notify_at = datetime.now(timezone.utc) + timedelta(minutes=estimated_minutes - 15)
            NotificationRepository.create({
                "user_id": user_id,
                "ticket_id": ticket["id"],
                "type": "reminder",
                "message": f"Your turn is approaching! Ticket #{ticket_number} - estimated in ~15 minutes.",
                "is_sent": False,
                "scheduled_at": notify_at.isoformat(),
                "sent_at": notify_at.isoformat()
            })

        # Attach extra data for response
        ticket["qr_image"] = qr_image
        ticket["position"] = position
        ticket["estimated_minutes"] = estimated_minutes
        ticket["velocity"] = wait_data["velocity_per_hour"]
        ticket["confidence"] = wait_data["confidence"]
        # Emit real-time update
        socketio.emit("queue_update", {"queue_id": queue["id"]})

        return ticket

    @staticmethod
    def cancel_ticket(ticket_id: str, user_id: str) -> dict:
        """Cancel a user's own ticket."""
        ticket = TicketRepository.find_by_id(ticket_id)
        if not ticket:
            raise NotFoundError("Ticket not found")

        if ticket["user_id"] != user_id:
            raise ForbiddenError("You can only cancel your own tickets")

        if ticket["status"] not in (TicketStatus.WAITING, TicketStatus.CALLED):
            raise ConflictError(f"Cannot cancel a ticket with status '{ticket['status']}'")

        updated = TicketRepository.update(ticket_id, {
            "status": TicketStatus.CANCELLED,
        })
        
        # Emit real-time update
        socketio.emit("queue_update", {"queue_id": ticket["queue_id"]})
        
        return updated

    @staticmethod
    def get_user_tickets(user_id: str) -> list[dict]:
        """Get user's active tickets with QR codes and queue stats."""
        tickets = TicketRepository.find_active_by_user(user_id)
        for ticket in tickets:
            if ticket.get("qr_code"):
                ticket["qr_image"] = QRService.generate_qr_image(ticket["qr_code"])
            if ticket.get("queue_id"):
                ticket["queue_stats"] = TicketRepository.get_queue_stats(ticket["queue_id"])
        return tickets

    @staticmethod
    def get_user_history(user_id: str) -> list[dict]:
        """Get user's ticket history with QR codes and queue stats."""
        tickets = TicketRepository.find_history_by_user(user_id)
        for ticket in tickets:
            if ticket.get("qr_code"):
                ticket["qr_image"] = QRService.generate_qr_image(ticket["qr_code"])
            if ticket.get("queue_id"):
                ticket["queue_stats"] = TicketRepository.get_queue_stats(ticket["queue_id"])
        return tickets

    @staticmethod
    def get_ticket_by_qr(qr_code: str) -> dict:
        """Look up a ticket by QR code (admin use)."""
        ticket = TicketRepository.find_by_qr_code(qr_code)
        if not ticket:
            raise NotFoundError("Ticket not found for this QR code")
        return ticket
