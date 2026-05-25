"""DALTI Backend — Utility constants and enums."""


class TicketStatus:
    WAITING = "waiting"
    CALLED = "called"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"

    ALL = {WAITING, CALLED, COMPLETED, MISSED, CANCELLED}


class QueueStatus:
    OPEN = "open"
    CLOSED = "closed"


class UserRole:
    USER = "user"
    ADMIN = "admin"
    AGENT = "agent"

    STAFF = {ADMIN, AGENT}


class ExchangeStatus:
    PENDING = "pending"
    ACCEPTED = "accepted"
    CANCELLED = "cancelled"


class AdminAction:
    CALLED = "called"
    COMPLETED = "completed"
    MISSED = "missed"


class NotificationType:
    EMAIL = "email"
    REMINDER = "reminder"


# Smart wait-time algorithm defaults
DEFAULT_ESTIMATED_TIME_MINUTES = 10
ROLLING_AVERAGE_WINDOW = 10

# Peak hour multipliers (24h format)
PEAK_HOURS = {8: 1.3, 9: 1.5, 10: 1.4, 11: 1.3, 13: 1.2, 14: 1.3}
OFF_PEAK_MULTIPLIER = 1.0

# Day-of-week weights (0=Monday, 6=Sunday)
DAY_WEIGHTS = {
    0: 1.2,  # Monday
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.1,  # Friday (pre-weekend rush)
    5: 0.7,  # Saturday (lighter)
    6: 0.5,  # Sunday
}

# Month-period weights
MONTH_PERIOD_WEIGHTS = {
    "start": 1.4,   # Days 1-5
    "mid": 1.0,     # Days 6-24
    "end": 1.3,     # Days 25-31
}
