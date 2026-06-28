"""Recompute and store seeker view → book conversion (distinct experts)."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def refresh_seeker_conversion_stats(session: AsyncSession, user_id: str) -> dict:
    r1 = await session.execute(
        text(
            "SELECT COUNT(DISTINCT expert_id) FROM expert_views WHERE user_id = :u"
        ),
        {"u": user_id},
    )
    viewed = int(r1.scalar() or 0)

    r2 = await session.execute(
        text(
            """
            SELECT COUNT(DISTINCT expert_id) FROM bookings
            WHERE seeker_id = :u
              AND status IN ('pending','confirmed','completed','rescheduled')
            """
        ),
        {"u": user_id},
    )
    booked = int(r2.scalar() or 0)

    rate = round(min(1.0, booked / viewed), 4) if viewed > 0 else 0.0

    await session.execute(
        text(
            """
            INSERT INTO seeker_conversion_stats
              (user_id, unique_experts_viewed, unique_experts_booked, conversion_rate)
            VALUES (:u, :v, :b, :r)
            ON DUPLICATE KEY UPDATE
              unique_experts_viewed = :v,
              unique_experts_booked = :b,
              conversion_rate = :r,
              updated_at = CURRENT_TIMESTAMP
            """
        ),
        {"u": user_id, "v": viewed, "b": booked, "r": rate},
    )

    return {
        "user_id": user_id,
        "unique_experts_viewed": viewed,
        "unique_experts_booked": booked,
        "conversion_rate": rate,
    }
