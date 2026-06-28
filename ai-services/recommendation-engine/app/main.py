from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.db.session import engine
from app.redis_client import close_redis


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title="Recommendation & ranking engine",
    description="Unique interaction tracking (Redis + MySQL) and expert ranking for the dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"docs": "/docs", "api": "/api/v1"}


def main():
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=False,
    )


if __name__ == "__main__":
    main()
