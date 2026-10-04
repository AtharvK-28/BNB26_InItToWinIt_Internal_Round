import hashlib
import json
import math
import shutil
import subprocess
from pathlib import Path

from fastapi import HTTPException, UploadFile

from creatorai.config import Settings


def media_tools(settings: Settings):
    ffmpeg = shutil.which(settings.ffmpeg_binary)
    ffprobe = shutil.which(settings.ffprobe_binary)
    if not ffmpeg or not ffprobe:
        raise HTTPException(
            503,
            "Clip import is waiting for media tools. Install FFmpeg and ffprobe on the API host.",
        )
    return ffmpeg, ffprobe


def receive(file: UploadFile, target: Path, limit: int):
    size = 0
    digest = hashlib.sha256()
    with target.open("xb") as output:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                raise HTTPException(413, "This clip is too large. Choose a file under 40 MB.")
            output.write(chunk)
            digest.update(chunk)
    if size == 0:
        raise HTTPException(422, "This file is empty. Choose a playable MP4 or WebM clip.")
    return size, digest.hexdigest()


def inspect_media(source: Path, thumbnail: Path, settings: Settings):
    ffmpeg, ffprobe = media_tools(settings)
    restricted_input = [
        "-protocol_whitelist",
        "file,pipe",
        "-format_whitelist",
        "mov,matroska,webm",
    ]
    try:
        probe = subprocess.run(
            [
                ffprobe,
                "-v",
                "error",
                *restricted_input,
                "-show_format",
                "-show_streams",
                "-of",
                "json",
                str(source),
            ],
            capture_output=True,
            timeout=15,
            check=True,
        )
        data = json.loads(probe.stdout)
        video = next(
            (
                stream
                for stream in data["streams"]
                if stream["codec_type"] == "video"
                and not stream.get("disposition", {}).get("attached_pic")
            ),
            None,
        )
        if not video:
            raise ValueError("No video track")
        duration = float(data["format"].get("duration", video.get("duration", 0)))
        width, height = int(video["width"]), int(video["height"])
        codec = video.get("codec_name", "")
        if not math.isfinite(duration) or duration <= 0 or duration > settings.max_clip_seconds:
            raise HTTPException(
                422,
                f"Choose a clip up to {settings.max_clip_seconds} seconds for this prototype.",
            )
        if width <= 0 or height <= 0 or width > 4096 or height > 4096:
            raise HTTPException(422, "Choose a clip with a resolution up to 4K for this prototype.")
        if codec not in {"h264", "vp8", "vp9", "av1"}:
            raise HTTPException(
                422, "Export an H.264 MP4 or a VP8/VP9 WebM for browser playback, then import it."
            )
        formats = set(data["format"]["format_name"].split(","))
        content_type = (
            "video/webm"
            if "webm" in formats
            else "video/quicktime"
            if source.suffix.lower() == ".mov"
            else "video/mp4"
        )
        subprocess.run(
            [
                ffmpeg,
                "-nostdin",
                "-v",
                "error",
                *restricted_input,
                "-threads",
                "1",
                "-ss",
                str(min(duration / 4, 2)),
                "-i",
                str(source),
                "-map",
                f"0:{video['index']}",
                "-frames:v",
                "1",
                "-vf",
                "scale=640:360:force_original_aspect_ratio=decrease",
                "-threads",
                "1",
                "-update",
                "1",
                str(thumbnail),
            ],
            capture_output=True,
            timeout=25,
            check=True,
        )
        return {
            "duration": duration,
            "width": width,
            "height": height,
            "codec": codec,
            "content_type": content_type,
        }
    except HTTPException:
        raise
    except (
        subprocess.CalledProcessError,
        subprocess.TimeoutExpired,
        ValueError,
        KeyError,
        TypeError,
        StopIteration,
    ):
        raise HTTPException(
            422, "We couldn’t read this clip. Choose a playable MP4 or WebM and try again."
        ) from None
