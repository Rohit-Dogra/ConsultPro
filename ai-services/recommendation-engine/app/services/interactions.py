"""Track unique user–category and user–expert interactions via Redis (dedup) + MySQL (durability)."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.redis_client import (
    category_click_set_key,
    functionality_click_set_key,
    get_redis,
    profile_view_set_key,
)


async def record_category_click(session: AsyncSession, user_id: str, category_id: str) -> dict:
    """
    Count at most one interaction per (user_id, category_id). Redis SET membership prevents
    duplicate counting; MySQL UNIQUE enforces the same if Redis is unavailable.
    """
    r = await get_redis()
    key = category_click_set_key(category_id)
    try:
        added = await r.sadd(key, user_id)
    except Exception:
        added = None

    use_redis = added is not None
    is_new_redis = use_redis and added == 1

    if use_redis and not is_new_redis:
        return {"recorded": False, "reason": "duplicate_user_category_pair", "is_new": False}

    res = await session.execute(
        text(
            """
            INSERT IGNORE INTO category_clicks (user_id, category_id)
            VALUES (:user_id, :category_id)
            """
        ),
        {"user_id": user_id, "category_id": category_id},
    )
    inserted = res.rowcount == 1

    if not inserted:
        if use_redis and is_new_redis:
            await r.srem(key, user_id)
        return {"recorded": False, "reason": "duplicate_user_category_pair", "is_new": False}

    await session.execute(
        text(
            """
            INSERT INTO category_click_totals (category_id, unique_clickers)
            VALUES (:category_id, 1)
            ON DUPLICATE KEY UPDATE
              unique_clickers = unique_clickers + 1,
              updated_at = CURRENT_TIMESTAMP
            """
        ),
        {"category_id": category_id},
    )

    return {"recorded": True, "is_new": True}


async def record_functionality_click(
    session: AsyncSession, user_id: str, functionality_id: int
) -> dict:
    """At most one row per (user_id, functionality_id); mirrors category_clicks for browse-by-area."""
    r = await get_redis()
    key = functionality_click_set_key(functionality_id)
    try:
        added = await r.sadd(key, user_id)
    except Exception:
        added = None

    use_redis = added is not None
    is_new_redis = use_redis and added == 1

    if use_redis and not is_new_redis:
        return {"recorded": False, "reason": "duplicate_user_functionality_pair", "is_new": False}

    res = await session.execute(
        text(
            """
            INSERT IGNORE INTO functionality_clicks (user_id, functionality_id)
            VALUES (:user_id, :functionality_id)
            """
        ),
        {"user_id": user_id, "functionality_id": functionality_id},
    )
    inserted = res.rowcount == 1

    if not inserted:
        if use_redis and is_new_redis:
            await r.srem(key, user_id)
        return {"recorded": False, "reason": "duplicate_user_functionality_pair", "is_new": False}

    await session.execute(
        text(
            """
            INSERT INTO functionality_click_totals (functionality_id, unique_clickers)
            VALUES (:fid, 1)
            ON DUPLICATE KEY UPDATE
              unique_clickers = unique_clickers + 1,
              updated_at = CURRENT_TIMESTAMP
            """
        ),
        {"fid": functionality_id},
    )

    return {"recorded": True, "is_new": True}


async def record_profile_view(session: AsyncSession, user_id: str, expert_id: str) -> dict:
    """At most one count per (user_id, expert_id) across repeated profile views."""
    if user_id == expert_id:
        return {"recorded": False, "reason": "self_view_ignored", "is_new": False}

    r = await get_redis()
    key = profile_view_set_key(expert_id)
    try:
        added = await r.sadd(key, user_id)
    except Exception:
        added = None

    use_redis = added is not None
    is_new_redis = use_redis and added == 1

    if use_redis and not is_new_redis:
        return {"recorded": False, "reason": "duplicate_user_expert_pair", "is_new": False}

    res = await session.execute(
        text(
            """
            INSERT IGNORE INTO expert_views (user_id, expert_id)
            VALUES (:user_id, :expert_id)
            """
        ),
        {"user_id": user_id, "expert_id": expert_id},
    )
    inserted = res.rowcount == 1

    if not inserted:
        if use_redis and is_new_redis:
            await r.srem(key, user_id)
        return {"recorded": False, "reason": "duplicate_user_expert_pair", "is_new": False}

    await session.execute(
        text(
            """
            INSERT INTO expert_view_totals (expert_user_id, unique_viewers)
            VALUES (:expert_id, 1)
            ON DUPLICATE KEY UPDATE
              unique_viewers = unique_viewers + 1,
              updated_at = CURRENT_TIMESTAMP
            """
        ),
        {"expert_id": expert_id},
    )

    return {"recorded": True, "is_new": True}
