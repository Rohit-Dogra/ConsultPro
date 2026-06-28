import redis.asyncio as redis

from app.config import settings

_redis: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def category_click_set_key(category_id: str) -> str:
    return f"category_clicks:users:{category_id}"


def profile_view_set_key(expert_id: str) -> str:
    return f"expert_views:users:{expert_id}"

def functionality_click_set_key(functionality_id: int) -> str:
    return f"functionality_clicks:users:{functionality_id}"

