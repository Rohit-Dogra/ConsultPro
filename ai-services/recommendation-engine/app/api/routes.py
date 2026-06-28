from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    CategoryClickEvent,
    CategoryStats,
    ExpertBookedEvent,
    ExpertCategoryMap,
    EventResponse,
    FunctionalityClickEvent,
    FunctionalityViewsSummaryRow,
    ProfileViewEvent,
    RankedExpert,
    SearchQueryEvent,
    SeekerConversionRollup,
    UserBehaviorSummary,
)
from app.db.session import get_db
from app.redis_client import category_click_set_key, get_redis, profile_view_set_key
from app.services import behavior as behavior_service
from app.services import conversion_stats
from app.services import interactions, ranking

router = APIRouter()


@router.post("/events/category-click", response_model=EventResponse)
async def post_category_click(
    body: CategoryClickEvent,
    session: AsyncSession = Depends(get_db),
):
    r = await interactions.record_category_click(session, body.user_id, body.category_id)
    return EventResponse(
        recorded=r["recorded"],
        is_new=r.get("is_new", False),
        reason=r.get("reason"),
    )


@router.post("/events/profile-view", response_model=EventResponse)
async def post_profile_view(
    body: ProfileViewEvent,
    session: AsyncSession = Depends(get_db),
):
    r = await interactions.record_profile_view(session, body.user_id, body.expert_id)
    if r.get("is_new"):
        await conversion_stats.refresh_seeker_conversion_stats(session, body.user_id)
    return EventResponse(
        recorded=r["recorded"],
        is_new=r.get("is_new", False),
        reason=r.get("reason"),
    )


@router.post("/events/expert-booked", response_model=SeekerConversionRollup)
async def post_expert_booked(
    body: ExpertBookedEvent,
    session: AsyncSession = Depends(get_db),
):
    """Call after a seeker creates a booking (Node already inserted `bookings`). Refreshes stored conversion stats."""
    data = await conversion_stats.refresh_seeker_conversion_stats(session, body.user_id)
    return SeekerConversionRollup(
        user_id=data["user_id"],
        unique_experts_viewed=data["unique_experts_viewed"],
        unique_experts_booked=data["unique_experts_booked"],
        conversion_rate=float(data["conversion_rate"]),
        updated_at=None,
    )


@router.get("/stats/user/{user_id}/conversion-rollup", response_model=SeekerConversionRollup)
async def get_conversion_rollup(
    user_id: str,
    session: AsyncSession = Depends(get_db),
):
    res = await session.execute(
        text(
            """
            SELECT user_id, unique_experts_viewed, unique_experts_booked, conversion_rate, updated_at
            FROM seeker_conversion_stats
            WHERE user_id = :u
            """
        ),
        {"u": user_id},
    )
    row = res.mappings().first()
    if not row:
        data = await conversion_stats.refresh_seeker_conversion_stats(session, user_id)
        return SeekerConversionRollup(
            user_id=data["user_id"],
            unique_experts_viewed=data["unique_experts_viewed"],
            unique_experts_booked=data["unique_experts_booked"],
            conversion_rate=float(data["conversion_rate"]),
            updated_at=None,
        )
    ua = row.get("updated_at")
    return SeekerConversionRollup(
        user_id=str(row["user_id"]),
        unique_experts_viewed=int(row["unique_experts_viewed"] or 0),
        unique_experts_booked=int(row["unique_experts_booked"] or 0),
        conversion_rate=float(row["conversion_rate"] or 0),
        updated_at=ua.isoformat() if ua is not None else None,
    )


@router.get(
    "/stats/functionality/views-summary",
    response_model=list[FunctionalityViewsSummaryRow],
)
async def functionality_views_summary(
    ids: str = Query(
        ...,
        description="Comma-separated expert_functionality_options.id values",
    ),
    session: AsyncSession = Depends(get_db),
):
    id_list: list[int] = []
    for x in ids.split(","):
        x = x.strip()
        if x.isdigit():
            id_list.append(int(x))
    if not id_list:
        return []
    union_parts = " UNION ALL ".join(f"SELECT {i} AS fid" for i in id_list)
    q = text(
        f"""
        SELECT f.fid AS functionality_id,
               COUNT(DISTINCT ev.user_id) AS total_profile_views
        FROM ({union_parts}) AS f
        LEFT JOIN expert_functionality_mapping efm ON efm.functionality_id = f.fid
        LEFT JOIN expert_views ev ON ev.expert_id = efm.expert_id
        GROUP BY f.fid
        ORDER BY f.fid
        """
    )
    result = await session.execute(q)
    counts: dict[int, int] = {}
    for row in result.mappings():
        counts[int(row["functionality_id"])] = int(row["total_profile_views"] or 0)
    return [
        FunctionalityViewsSummaryRow(
            functionality_id=i,
            total_profile_views=counts.get(i, 0),
        )
        for i in id_list
    ]


@router.post("/events/functionality-click", response_model=EventResponse)
async def post_functionality_click(
    body: FunctionalityClickEvent,
    session: AsyncSession = Depends(get_db),
):
    r = await interactions.record_functionality_click(
        session, body.user_id, body.functionality_id
    )
    return EventResponse(
        recorded=r["recorded"],
        is_new=r.get("is_new", False),
        reason=r.get("reason"),
    )


@router.post("/events/search-query", status_code=201)
async def post_search_query(
    body: SearchQueryEvent,
    session: AsyncSession = Depends(get_db),
):
    await behavior_service.record_search_query(
        session,
        body.user_id,
        query_text=body.query_text,
        problem_statement=body.problem_statement,
        keywords=body.keywords,
    )
    return {"recorded": True}


@router.get("/stats/user/{user_id}/behavior", response_model=UserBehaviorSummary)
async def get_user_behavior(
    user_id: str,
    session: AsyncSession = Depends(get_db),
):
    data = await behavior_service.get_user_behavior_summary(session, user_id)
    return UserBehaviorSummary(**data)


@router.get("/ranking/experts", response_model=list[RankedExpert])
async def get_ranked_experts(
    category_id: str | None = Query(
        None,
        description="When set, boosts experts mapped to this category (expert_category_map)",
    ),
    user_id: str | None = Query(
        None,
        description="Seeker id for personalization (category clicks overlap with expert categories)",
    ),
    limit: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_db),
):
    rows = await ranking.rank_experts(
        session, category_id=category_id, user_id=user_id, limit=limit
    )
    return [RankedExpert(**r) for r in rows]


@router.get("/stats/category/{category_id}", response_model=CategoryStats)
async def get_category_stats(
    category_id: str,
    session: AsyncSession = Depends(get_db),
):
    res = await session.execute(
        text(
            """
            SELECT COALESCE(unique_clickers, 0) AS c
            FROM category_click_totals
            WHERE category_id = :cid
            """
        ),
        {"cid": category_id},
    )
    row = res.first()
    mysql_count = int(row[0]) if row else 0

    redis_count: int | None = None
    try:
        r = await get_redis()
        redis_count = await r.scard(category_click_set_key(category_id))
    except Exception:
        redis_count = None

    return CategoryStats(
        category_id=category_id,
        unique_clickers_mysql=mysql_count,
        unique_clickers_redis=redis_count,
    )


@router.post("/admin/expert-category", status_code=201)
async def map_expert_to_category(
    body: ExpertCategoryMap,
    session: AsyncSession = Depends(get_db),
):
    await session.execute(
        text(
            """
            INSERT IGNORE INTO expert_category_map (expert_user_id, category_id)
            VALUES (:eid, :cid)
            """
        ),
        {"eid": body.expert_user_id, "cid": body.category_id},
    )
    return {"ok": True, "mapped": True}


@router.get("/stats/expert/{expert_id}/views")
async def get_expert_view_stats(
    expert_id: str,
    session: AsyncSession = Depends(get_db),
):
    res = await session.execute(
        text(
            """
            SELECT COALESCE(unique_viewers, 0) FROM expert_view_totals
            WHERE expert_user_id = :eid
            """
        ),
        {"eid": expert_id},
    )
    row = res.first()
    mysql_views = int(row[0]) if row else 0
    try:
        r = await get_redis()
        redis_views = await r.scard(profile_view_set_key(expert_id))
    except Exception:
        redis_views = None
    return {
        "expert_id": expert_id,
        "unique_viewers_mysql": mysql_views,
        "unique_viewers_redis": redis_views,
    }


@router.get("/health")
async def health():
    return {"status": "ok", "service": "recommendation-engine"}
