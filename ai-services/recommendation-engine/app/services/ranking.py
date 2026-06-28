"""Expert ranking: demand (24h bookings, conversion), engagement, personalization, availability, quality."""

import math
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


def _min_max_norm(values: list[float], invert: bool = False) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi - lo < 1e-9:
        return [0.5 for _ in values]
    out = []
    for v in values:
        n = (v - lo) / (hi - lo)
        if invert:
            n = 1.0 - n
        out.append(max(0.0, min(1.0, n)))
    return out


async def fetch_expert_metrics(
    session: AsyncSession,
    category_id: str | None,
    user_id: str | None,
) -> list[dict[str, Any]]:
    sql = text(
        """
        SELECT
          u.id AS expert_id,
          ep.first_name AS first_name,
          ep.last_name AS last_name,
          COALESCE(ep.audio_pricing, 0) AS price,
          COALESCE(rt.unique_viewers, 0) AS unique_profile_views,
          (SELECT COUNT(*) FROM expert_availability ea WHERE ea.user_id = u.id) AS availability_slots,
          COALESCE(
            (SELECT AVG(sf.rating) FROM session_feedback sf
             INNER JOIN bookings b ON b.id = sf.booking_id
             WHERE b.expert_id = u.id AND sf.user_role = 'seeker' AND sf.rating IS NOT NULL),
            3.0
          ) AS avg_rating,
          COALESCE(
            (
              SELECT
                CASE
                  WHEN SUM(CASE WHEN b.status IN ('confirmed','completed','rejected') THEN 1 ELSE 0 END) = 0
                    THEN 0.5
                  ELSE
                    SUM(CASE WHEN b.status IN ('confirmed','completed') THEN 1 ELSE 0 END) /
                    NULLIF(
                      SUM(CASE WHEN b.status IN ('confirmed','completed','rejected') THEN 1 ELSE 0 END),
                      0
                    )
                END
              FROM bookings b
              WHERE b.expert_id = u.id
            ),
            0.5
          ) AS acceptance_ratio,
          CASE
            WHEN :category_is_null = 1 THEN 0.5
            WHEN EXISTS (
              SELECT 1 FROM expert_category_map m
              WHERE m.expert_user_id = u.id AND m.category_id = :category_id
            ) THEN 1.0
            ELSE 0.15
          END AS category_relevance,
          CASE
            WHEN :category_is_null = 1 THEN 0
            ELSE COALESCE(
              (SELECT cuct.unique_clickers FROM category_click_totals cuct
               WHERE cuct.category_id = :category_id LIMIT 1),
              0
            )
          END AS category_unique_clickers,
          (
            SELECT COUNT(*)
            FROM bookings b
            WHERE b.expert_id = u.id
              AND b.status IN ('pending','confirmed','completed','rescheduled')
              AND b.created_at >= (NOW() - INTERVAL 24 HOUR)
          ) AS bookings_24h,
          (
            SELECT COUNT(*)
            FROM bookings b
            WHERE b.expert_id = u.id
              AND b.status IN ('pending','confirmed','completed','rescheduled')
          ) AS bookings_total,
          CASE
            WHEN :puid_set = 0 THEN 0.5
            WHEN EXISTS (
              SELECT 1
              FROM expert_category_map m
              INNER JOIN category_clicks ucc
                ON ucc.category_id = m.category_id AND ucc.user_id = :puid
              WHERE m.expert_user_id = u.id
            ) THEN 1.0
            ELSE 0.2
          END AS personalization_match,
          CASE
            WHEN (SELECT COUNT(*) FROM expert_availability ea WHERE ea.user_id = u.id) > 0 THEN 1.0
            ELSE 0.15
          END AS availability_boost
        FROM users u
        INNER JOIN expert_profiles ep ON ep.user_id = u.id
        LEFT JOIN expert_view_totals rt ON rt.expert_user_id = u.id
        WHERE u.role = 'expert'
        """
    )
    cid = category_id or ""
    result = await session.execute(
        sql,
        {
            "category_id": cid,
            "category_is_null": 1 if category_id is None else 0,
            "puid": user_id or "",
            "puid_set": 1 if user_id else 0,
        },
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


def compute_scores(
    rows: list[dict[str, Any]],
    category_id: str | None,
) -> list[dict[str, Any]]:
    if not rows:
        return []

    views = [float(r["unique_profile_views"]) for r in rows]
    acc = [float(r["acceptance_ratio"]) for r in rows]
    ratings = [float(r["avg_rating"]) / 5.0 for r in rows]
    avail_slots = [float(r["availability_slots"]) for r in rows]
    prices = [float(r["price"]) for r in rows]
    rel = [float(r["category_relevance"]) for r in rows]
    book24 = [float(r["bookings_24h"]) for r in rows]
    book_tot = [float(r["bookings_total"]) for r in rows]
    pers = [float(r["personalization_match"]) for r in rows]
    avail_boost = [float(r["availability_boost"]) for r in rows]

    n_views = _min_max_norm([math.log1p(v) for v in views])
    n_acc = acc
    n_rating = ratings
    n_avail_slots = _min_max_norm(avail_slots)
    n_price = _min_max_norm(prices, invert=True)
    n_book24 = _min_max_norm([math.log1p(v) for v in book24])

    # Conversion: bookings / unique viewers (cap 1.0); if no views, use small prior
    conversion_raw: list[float] = []
    for i, r in enumerate(rows):
        v = max(float(r["unique_profile_views"]), 1.0)
        c = min(1.0, float(r["bookings_total"]) / v)
        conversion_raw.append(c)
    n_conversion = conversion_raw

    cat_pop_boost = 0.0
    if category_id and rows:
        pop = float(rows[0].get("category_unique_clickers") or 0)
        cat_pop_boost = math.log1p(pop) / 10.0

    w = settings
    out: list[dict[str, Any]] = []
    for i, r in enumerate(rows):
        rel_i = rel[i]
        if category_id and rel_i >= 1.0:
            rel_i = min(1.0, rel_i + cat_pop_boost * 0.1)

        score = (
            w.weight_profile_views * n_views[i]
            + w.weight_category_relevance * rel_i
            + w.weight_acceptance * n_acc[i]
            + w.weight_rating * n_rating[i]
            + w.weight_availability * n_avail_slots[i]
            + w.weight_price_inverse * n_price[i]
            + w.weight_bookings_24h * n_book24[i]
            + w.weight_conversion * n_conversion[i]
            + w.weight_personalization * pers[i]
            + w.weight_availability_signal * avail_boost[i]
        )

        conv_display = float(r["bookings_total"]) / max(float(r["unique_profile_views"]), 1.0)
        conv_display = min(1.0, round(conv_display, 4))

        item = {
            "expert_id": r["expert_id"],
            "display_name": f"{r['first_name']} {r['last_name']}".strip(),
            "rank_score": round(score, 6),
            "components": {
                "unique_profile_views": int(r["unique_profile_views"]),
                "bookings_last_24h": int(r["bookings_24h"]),
                "bookings_total": int(r["bookings_total"]),
                "view_to_booking_conversion": conv_display,
                "category_relevance": round(float(r["category_relevance"]), 4),
                "personalization_match": round(float(r["personalization_match"]), 4),
                "acceptance_ratio": round(float(r["acceptance_ratio"]), 4),
                "avg_rating_1_to_5": round(float(r["avg_rating"]), 2),
                "availability_slots": int(r["availability_slots"]),
                "availability_boost": round(float(r["availability_boost"]), 4),
                "audio_pricing": float(r["price"]),
            },
        }
        out.append(item)

    out.sort(key=lambda x: x["rank_score"], reverse=True)
    for idx, item in enumerate(out, start=1):
        item["position"] = idx
    return out


async def rank_experts(
    session: AsyncSession,
    category_id: str | None = None,
    user_id: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    rows = await fetch_expert_metrics(session, category_id=category_id, user_id=user_id)
    ranked = compute_scores(rows, category_id)
    return ranked[: max(1, min(limit, 500))]
