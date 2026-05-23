"""DALTI Backend — Smart waiting time algorithm.

Calculates estimated wait time using:
- Rolling average of last 10 actual wait times
- Time-of-day weight (peak hours)
- Day-of-week weight
- Month-period weight
- Tickets ahead in queue

Formula: estimated = base_avg × time_weight × day_weight × period_weight × position
"""

from datetime import datetime, timezone
from app.repositories.ticket_repo import TicketRepository
from app.utils.constants import (
    DEFAULT_ESTIMATED_TIME_MINUTES,
    ROLLING_AVERAGE_WINDOW,
    PEAK_HOURS,
    OFF_PEAK_MULTIPLIER,
    DAY_WEIGHTS,
    MONTH_PERIOD_WEIGHTS,
)


class WaitTimeService:
    """Smart estimated wait time calculator."""

    @staticmethod
    def calculate(queue_id: str, position: int = 1) -> int:
        """Calculate estimated wait time in minutes.

        Args:
            queue_id: UUID of the queue.
            position: Number of people ahead (1 = next in line).

        Returns:
            Estimated wait time in minutes (integer).
        """
        now = datetime.now(timezone.utc)

        # Step 1: Get rolling average of recent actual wait times
        base_avg = WaitTimeService._get_rolling_average(queue_id)

        # Step 2: Apply time-of-day weight
        time_weight = WaitTimeService._get_time_weight(now.hour)

        # Step 3: Apply day-of-week weight
        day_weight = WaitTimeService._get_day_weight(now.weekday())

        # Step 4: Apply month-period weight
        period_weight = WaitTimeService._get_period_weight(now.day)

        # Step 5: Calculate final estimate
        estimated = base_avg * time_weight * day_weight * period_weight * position

        return max(1, round(estimated))

    @staticmethod
    def _get_rolling_average(queue_id: str) -> float:
        """Get rolling average of last N actual wait times.

        Falls back to DEFAULT_ESTIMATED_TIME_MINUTES when no data.
        """
        wait_times = TicketRepository.get_recent_wait_times(
            queue_id, ROLLING_AVERAGE_WINDOW
        )

        if not wait_times:
            return float(DEFAULT_ESTIMATED_TIME_MINUTES)

        return sum(wait_times) / len(wait_times)

    @staticmethod
    def _get_time_weight(hour: int) -> float:
        """Get multiplier based on hour of day.

        Peak hours (8-11, 13-14) have higher multipliers.
        """
        return PEAK_HOURS.get(hour, OFF_PEAK_MULTIPLIER)

    @staticmethod
    def _get_day_weight(weekday: int) -> float:
        """Get multiplier based on day of week (0=Mon, 6=Sun)."""
        return DAY_WEIGHTS.get(weekday, 1.0)

    @staticmethod
    def _get_period_weight(day_of_month: int) -> float:
        """Get multiplier based on period within month.

        Start of month (1-5) and end (25-31) have higher demand.
        """
        if day_of_month <= 5:
            return MONTH_PERIOD_WEIGHTS["start"]
        elif day_of_month >= 25:
            return MONTH_PERIOD_WEIGHTS["end"]
        return MONTH_PERIOD_WEIGHTS["mid"]

    @staticmethod
    def calculate_with_velocity(queue_id: str, position: int = 1) -> dict:
        """Enhanced calculation including ticket velocity for AI-improved prediction.

        Returns dict with estimated_minutes, velocity, and confidence.
        """
        now = datetime.now(timezone.utc)
        base_estimate = WaitTimeService.calculate(queue_id, position)

        # Calculate velocity: tickets processed per hour (last hour)
        wait_times = TicketRepository.get_recent_wait_times(queue_id, 20)
        if len(wait_times) >= 3:
            avg_service_time = sum(wait_times) / len(wait_times)
            velocity = 60 / avg_service_time if avg_service_time > 0 else 0
            confidence = min(len(wait_times) / ROLLING_AVERAGE_WINDOW, 1.0)
        else:
            velocity = 0
            confidence = 0.3  # Low confidence when no data

        # Adjust estimate based on velocity
        if velocity > 0:
            velocity_estimate = (position / velocity) * 60  # minutes
            # Blend: 70% smart algorithm + 30% velocity
            blended = (base_estimate * 0.7) + (velocity_estimate * 0.3)
            final = max(1, round(blended))
        else:
            final = base_estimate

        return {
            "estimated_minutes": final,
            "velocity_per_hour": round(velocity, 1),
            "confidence": round(confidence, 2),
        }
