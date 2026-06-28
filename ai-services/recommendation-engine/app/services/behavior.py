"""Search query logging and user-level behavior stats."""

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def record_search_query(
    session: AsyncSession,
    user_id: str,
    query_text: str | None = None,
    problem_statement: str | None = None,
    keywords: list[str] | None = None,
) -> None:
    kw_val = json.dumps(keywords) if keywords else None
    await session.execute(
        text(
            """
            INSERT INTO search_history (user_id, query_text, problem_statement, keywords)
            VALUES (:uid, :qt, :ps, :kw)
            """
        ),
        {
            "uid": user_id,
            "qt": query_text,
            "ps": problem_statement,
            "kw": kw_val,
        },
    )


async def get_user_behavior_summary(session: AsyncSession, user_id: str) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT
              (SELECT COUNT(DISTINCT expert_id) FROM expert_views WHERE user_id = :uid)
                AS unique_experts_viewed,
              (SELECT COUNT(DISTINCT expert_id) FROM bookings
               WHERE seeker_id = :uid
                 AND status IN ('pending','confirmed','completed','rescheduled'))
                AS unique_experts_booked,
              (SELECT COUNT(*) FROM search_history WHERE user_id = :uid) AS search_queries_count,
              (SELECT COUNT(DISTINCT category_id) FROM category_clicks WHERE user_id = :uid)
                AS distinct_categories_clicked
            """
        ),
        {"uid": user_id},
    )
    row = res.mappings().first()
    if not row:
        return {}
    viewed = int(row["unique_experts_viewed"] or 0)
    booked = int(row["unique_experts_booked"] or 0)
    conv = (booked / viewed) if viewed > 0 else 0.0
    return {
        "user_id": user_id,
        "unique_experts_viewed": viewed,
        "unique_experts_booked": booked,
        "view_to_book_conversion_rate": round(conv, 4),
        "search_queries_recorded": int(row["search_queries_count"] or 0),
        "distinct_categories_clicked": int(row["distinct_categories_clicked"] or 0),
    }
