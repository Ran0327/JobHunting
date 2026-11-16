from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "JobHunting API"
    environment: Literal["development", "test", "production"] = "development"
    debug: bool = False
    api_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+asyncpg://jobhunting:jobhunting_dev@localhost:5432/jobhunting"
    )
    redis_url: str = "redis://localhost:6379/0"

    cors_origins: list[str] = Field(default_factory=list)

    session_cookie_name: str = "jh_session"
    session_cookie_secure: bool = False
    session_ttl_seconds: int = 7 * 24 * 60 * 60
    session_absolute_ttl_seconds: int = 30 * 24 * 60 * 60

    upload_dir: Path = Path("/data/uploads")
    storage_backend: Literal["local", "minio"] = "local"
    max_upload_bytes: int = 15 * 1024 * 1024

    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if value is None or value == "":
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
