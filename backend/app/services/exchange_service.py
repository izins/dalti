"""DALTI Backend — Ticket exchange service."""

from app.repositories.exchange_repo import ExchangeRepository
from app.repositories.ticket_repo import TicketRepository
from app.utils.errors import NotFoundError, ConflictError, ForbiddenError, ValidationError
from app.utils.constants import ExchangeStatus, TicketStatus


class ExchangeService:
    """Ticket exchange business logic."""

    @staticmethod
    def propose_exchange(owner_ticket_id: str, target_ticket_id: str, user_id: str) -> dict:
        owner_ticket = TicketRepository.find_by_id(owner_ticket_id)
        target_ticket = TicketRepository.find_by_id(target_ticket_id)
        if not owner_ticket or not target_ticket:
            raise NotFoundError("One or both tickets not found")
        if owner_ticket["user_id"] != user_id:
            raise ForbiddenError("You can only propose exchanges for your own tickets")
        if owner_ticket["queue_id"] != target_ticket["queue_id"]:
            raise ValidationError("Both tickets must be in the same queue")
        if owner_ticket["status"] != TicketStatus.WAITING or target_ticket["status"] != TicketStatus.WAITING:
            raise ConflictError("Both tickets must be in waiting status")
        return ExchangeRepository.create({
            "ticket_owner_id": owner_ticket_id,
            "ticket_target_id": target_ticket_id,
            "status": ExchangeStatus.PENDING,
        })

    @staticmethod
    def accept_exchange(exchange_id: str, user_id: str) -> dict:
        exchange = ExchangeRepository.find_by_id(exchange_id)
        if not exchange:
            raise NotFoundError("Exchange not found")
        if exchange["status"] != ExchangeStatus.PENDING:
            raise ConflictError("Exchange is no longer pending")
        target_ticket = exchange.get("target", {})
        if target_ticket.get("user_id") != user_id:
            raise ForbiddenError("Only the target ticket owner can accept")
        owner_ticket = exchange.get("owner", {})
        # Atomic swap
        TicketRepository.update(owner_ticket["id"], {"number": target_ticket["number"]})
        TicketRepository.update(target_ticket["id"], {"number": owner_ticket["number"]})
        ExchangeRepository.update(exchange_id, {"status": ExchangeStatus.ACCEPTED})
        return {"message": "Exchange accepted", "swapped": True}

    @staticmethod
    def reject_exchange(exchange_id: str, user_id: str) -> dict:
        exchange = ExchangeRepository.find_by_id(exchange_id)
        if not exchange:
            raise NotFoundError("Exchange not found")
        if exchange["status"] != ExchangeStatus.PENDING:
            raise ConflictError("Exchange is no longer pending")
        ExchangeRepository.update(exchange_id, {"status": ExchangeStatus.CANCELLED})
        return {"message": "Exchange cancelled"}

    @staticmethod
    def get_user_exchanges(user_id: str) -> dict:
        incoming = ExchangeRepository.find_pending_for_user(user_id)
        outgoing = ExchangeRepository.find_by_user(user_id)
        return {"incoming": incoming, "outgoing": outgoing}

    @staticmethod
    def discover_partners(user_id: str) -> list[dict]:
        """Find potential exchange partners (people in the same queues as the user)."""
        active_tickets = TicketRepository.find_active_by_user(user_id)
        if not active_tickets:
            return []
        
        partners = []
        for ticket in active_tickets:
            others = TicketRepository.find_waiting_in_queue(ticket["queue_id"])
            # Filter out self
            filtered = [t for t in others if t["user_id"] != user_id]
            for o in filtered:
                o["my_ticket_id"] = ticket["id"] # Context for the UI
            partners.extend(filtered)
            
        return partners
