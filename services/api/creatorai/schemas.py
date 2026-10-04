from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from creatorai.media import asset_kind

Platform = Literal["youtube", "instagram", "tiktok", "linkedin", "x"]


class ProjectFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    brief: str = Field(default="", max_length=20000)
    platforms: list[Platform] = Field(min_length=1, max_length=5)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Give your project a title.")
        return value.strip()

    @field_validator("platforms")
    @classmethod
    def unique_platforms(cls, value: list[Platform]) -> list[Platform]:
        if len(set(value)) != len(value):
            raise ValueError("Choose each platform once.")
        return value


class ProjectUpdate(ProjectFields):
    revision: int = Field(ge=1)


class ProjectRead(ProjectFields):
    model_config = ConfigDict(from_attributes=True)

    id: str
    revision: int
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        # SQLite drops tzinfo; these columns are always written in UTC.
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    filename: str
    content_type: str
    bytes: int
    duration: float
    width: int
    height: int
    codec: str
    created_at: datetime

    @computed_field
    @property
    def kind(self) -> Literal["video", "image", "audio", "document"]:
        return asset_kind(self.content_type)

    @field_validator("created_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
