from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "exp"

    redis_url: str = "redis://127.0.0.1:6379/0"

    api_host: str = "0.0.0.0"
    api_port: int = 8088

    # Comma-separated. Cannot use * with allow_credentials=True (browser blocks).
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8080,http://127.0.0.1:8080"
    )

    weight_profile_views: float = 0.85
    weight_category_relevance: float = 0.75
    weight_acceptance: float = 0.55
    weight_rating: float = 0.65
    weight_availability: float = 0.35
    weight_price_inverse: float = 0.25
    weight_bookings_24h: float = 0.45
    weight_conversion: float = 0.4
    weight_personalization: float = 0.5
    weight_availability_signal: float = 0.35

    @property
    def mysql_dsn(self) -> str:
        # Passwords with @, :, /, etc. break naive URLs — must encode userinfo.
        u = quote_plus(self.mysql_user, safe="")
        p = quote_plus(self.mysql_password, safe="")
        return (
            f"mysql+aiomysql://{u}:{p}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )

    @property
    def cors_allow_origins(self) -> list[str]:
        parts = [x.strip() for x in self.cors_origins.split(",") if x.strip()]
        return parts if parts else ["*"]

    @property
    def cors_allow_credentials(self) -> bool:
        o = self.cors_allow_origins
        return not (len(o) == 1 and o[0] == "*")


settings = Settings()
