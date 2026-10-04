import os
import secrets
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url

API_ROOT = Path(__file__).resolve().parents[1]
ROOT = API_ROOT.parents[1] if API_ROOT.parent.name == "services" else API_ROOT
LOCAL_OWNER = "00000000-0000-0000-0000-000000000001"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=API_ROOT / ".env", extra="ignore", hide_input_in_errors=True
    )
    app_mode: Literal["local", "cloud"] = "local"
    database_url: SecretStr = SecretStr("")
    database_password: SecretStr = SecretStr("")
    data_dir: Path = ROOT / ".local"
    storage_backend: Literal["local", "supabase"] = "local"
    supabase_url: str = ""
    supabase_service_role_key: SecretStr = SecretStr("")
    storage_bucket: str = "creatorai-media"
    cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000"
    allowed_hosts: str = "127.0.0.1,localhost,testserver"
    media_signing_secret: SecretStr = Field(
        default_factory=lambda: SecretStr(secrets.token_hex(32))
    )
    max_upload_mb: int = Field(default=40, ge=1, le=40)
    max_clip_seconds: int = Field(default=180, ge=1, le=180)
    ffmpeg_binary: str = "ffmpeg"
    ffprobe_binary: str = "ffprobe"
    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-3.5-flash"
    enable_demo_worker: bool = False
    max_agent_steps: int = Field(default=6, ge=2, le=10)

    @field_validator("media_signing_secret", mode="before")
    @classmethod
    def local_secret(cls, value):
        return value or secrets.token_hex(32)

    @model_validator(mode="after")
    def deployment_constraints(self):
        origins = self.origins
        if not origins or "*" in self.hosts:
            raise ValueError("Configure explicit CORS_ORIGINS and ALLOWED_HOSTS.")
        for origin in origins:
            parsed = urlsplit(origin)
            if parsed.scheme not in {"https", "http"} or not parsed.netloc or parsed.path:
                raise ValueError("CORS_ORIGINS must contain exact origins without paths or '*'.")
        if self.app_mode == "cloud":
            if not self.database_url.get_secret_value().startswith(("postgresql", "postgres://")):
                raise ValueError("Cloud mode requires a Postgres DATABASE_URL.")
            if self.storage_backend != "supabase":
                raise ValueError("Cloud mode requires private Supabase storage.")
            if not self.supabase_url.startswith("https://") or not (
                self.supabase_service_role_key.get_secret_value()
            ):
                raise ValueError("Configure SUPABASE_URL and the server-only service role key.")
            if len(self.media_signing_secret.get_secret_value()) < 32:
                raise ValueError("MEDIA_SIGNING_SECRET must contain at least 32 characters.")
        elif self.database_url.get_secret_value().startswith(("postgres",)):
            raise ValueError("Set APP_MODE=cloud before connecting to hosted Postgres.")
        if os.environ.get("RENDER") and self.app_mode != "cloud":
            raise ValueError(
                "Render deployments require cloud mode; local persistence is ephemeral."
            )
        return self

    @property
    def origins(self):
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def hosts(self):
        return [value.strip() for value in self.allowed_hosts.split(",") if value.strip()]

    @property
    def sql_url(self) -> URL:
        raw = self.database_url.get_secret_value()
        if not raw:
            return URL.create("sqlite", database=str(self.data_dir / "creatorai.db"))
        if raw.startswith("postgres://"):
            raw = "postgresql://" + raw[len("postgres://") :]
        url = make_url(raw)
        if url.get_backend_name() == "postgresql":
            url = url.set(drivername="postgresql+psycopg")
            if self.database_password.get_secret_value():
                url = url.set(password=self.database_password.get_secret_value())
            url = url.update_query_dict({"sslmode": "require"})
        return url
