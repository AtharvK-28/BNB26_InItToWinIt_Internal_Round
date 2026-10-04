from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


Preset = Literal["youtube_shorts", "instagram_reel", "tiktok", "youtube_video", "square_post"]


class Segment(StrictModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    text: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start:
            raise ValueError("The end must follow the start.")
        return self


class Observation(StrictModel):
    time: float = Field(ge=0)
    description: str = Field(min_length=1, max_length=700)


class Understanding(StrictModel):
    summary: str = Field(min_length=1, max_length=2000)
    language: str = Field(max_length=80)
    transcript: list[Segment] = Field(max_length=120)
    visuals: list[Observation] = Field(max_length=20)
    notes: str = Field(max_length=1000)


class Hook(StrictModel):
    text: str = Field(min_length=1, max_length=300)
    angle: str = Field(max_length=200)


class StoryResult(StrictModel):
    hooks: list[Hook] = Field(min_length=3, max_length=5)
    script: str = Field(min_length=20, max_length=12000)
    caption: str = Field(max_length=2200)
    titles: list[str] = Field(min_length=2, max_length=3)


class Cover(StrictModel):
    title: str = Field(default="", max_length=100)
    subtitle: str = Field(default="", max_length=120)
    title_x: float = Field(default=0.08, ge=0, le=0.8)
    title_y: float = Field(default=0.62, ge=0.1, le=0.9)
    subtitle_x: float = Field(default=0.08, ge=0, le=0.8)
    subtitle_y: float = Field(default=0.84, ge=0.1, le=0.95)
    theme: Literal["paper", "coral", "ink"] = "paper"
    # An image from the project's assets replaces the frame from the cut.
    image_asset_id: str | None = Field(default=None, max_length=36)


class Music(StrictModel):
    asset_id: str = Field(min_length=1, max_length=36)
    volume: float = Field(default=0.25, ge=0, le=1)


class ClipDocument(StrictModel):
    title: str = Field(min_length=1, max_length=100)
    hook: str = Field(default="", max_length=300)
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    rationale: str = Field(default="", max_length=1000)
    source_quote: str = Field(default="", max_length=800)
    script_match: str = Field(default="", max_length=700)
    caption: str = Field(default="", max_length=2200)
    # Per-format post copy; formats without an entry use `caption`.
    platform_captions: dict[Preset, str] = Field(default_factory=dict)
    crop_x: float = Field(default=0.5, ge=0, le=1)
    subtitles: bool = True
    subtitle_segments: list[Segment] = Field(default_factory=list, max_length=120)
    cover: Cover = Field(default_factory=Cover)
    music: Music | None = None

    @model_validator(mode="after")
    def valid_cut(self):
        if self.end <= self.start or self.end - self.start > 60:
            raise ValueError("A clip must run forward and last at most 60 seconds.")
        if any(len(text) > 2200 for text in self.platform_captions.values()):
            raise ValueError("Keep each platform caption under 2,200 characters.")
        return self


class Proposal(StrictModel):
    title: str = Field(min_length=1, max_length=100)
    hook: str = Field(max_length=300)
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    rationale: str = Field(max_length=1000)
    source_quote: str = Field(max_length=800)
    script_match: str = Field(max_length=700)
    caption: str = Field(max_length=2200)


class ClipPlan(StrictModel):
    clips: list[Proposal] = Field(min_length=1, max_length=3)
    coverage_notes: str = Field(max_length=1200)


class SearchArgs(StrictModel):
    query: str = Field(max_length=250)


class WindowArgs(StrictModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    question: str = Field(min_length=1, max_length=500)


class RunRequest(StrictModel):
    request_id: UUID
    kind: Literal["story", "analyze", "clips", "export"]
    asset_id: UUID | None = None
    clip_id: UUID | None = None
    clip_revision: int | None = Field(default=None, ge=1)
    preset: Preset = "youtube_shorts"
    instruction: str = Field(default="", max_length=2000)


class ReviewDecision(StrictModel):
    action: Literal["approve", "revise"]
    feedback: str = Field(default="", max_length=2000)


class ClipUpdate(StrictModel):
    revision: int = Field(ge=1)
    document: ClipDocument


class ManualClip(StrictModel):
    request_id: UUID
    asset_id: UUID


class RunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    kind: str
    status: str
    stage: str
    output: dict
    events: list
    error: str
    created_at: datetime
    updated_at: datetime


class ClipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    asset_id: str
    run_id: str
    revision: int
    script_revision: int
    document: ClipDocument
    created_at: datetime
    updated_at: datetime


def now():
    return datetime.now(UTC)
