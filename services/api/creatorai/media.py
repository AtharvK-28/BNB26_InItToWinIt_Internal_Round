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
                raise HTTPException(
                    413, f"This file is too large. Choose a file under {limit // 1024 // 1024} MB."
                )
            output.write(chunk)
            digest.update(chunk)
    if size == 0:
        raise HTTPException(422, "This file is empty. Choose another file.")
    return size, digest.hexdigest()


# Footage feeds the clip pipeline; images, audio and documents are stored and organized
# alongside it (covers, music beds, briefs). SVG and HTML are refused: they can carry script.
KINDS = {
    ".mp4": "video",
    ".webm": "video",
    ".mov": "video",
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".webp": "image",
    ".gif": "image",
    ".mp3": "audio",
    ".wav": "audio",
    ".m4a": "audio",
    ".aac": "audio",
    ".ogg": "audio",
    ".flac": "audio",
    ".pdf": "document",
    ".txt": "document",
    ".md": "document",
    ".srt": "document",
}


def asset_kind(content_type: str):
    for prefix in ("video", "image", "audio"):
        if content_type.startswith(prefix + "/"):
            return prefix
    return "document"


def probe(source: Path, settings: Settings, formats: str):
    _, ffprobe = media_tools(settings)
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-protocol_whitelist",
            "file,pipe",
            "-format_whitelist",
            formats,
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
    return json.loads(result.stdout)


def still(source: Path, thumbnail: Path, settings: Settings, formats: str, graph: str):
    ffmpeg, _ = media_tools(settings)
    subprocess.run(
        [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-protocol_whitelist",
            "file,pipe",
            "-format_whitelist",
            formats,
            "-i",
            str(source),
            "-filter_complex",
            graph,
            "-frames:v",
            "1",
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


IMAGE_FORMATS = "png_pipe,jpeg_pipe,webp_pipe,gif,image2"
IMAGE_TYPES = {"png": "image/png", "mjpeg": "image/jpeg", "webp": "image/webp", "gif": "image/gif"}
AUDIO_FORMATS = "mp3,wav,mov,ogg,aac,flac"
AUDIO_TYPES = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "aac": "audio/aac",
    "flac": "audio/flac",
}


def inspect_image(source: Path, thumbnail: Path, settings: Settings):
    try:
        data = probe(source, settings, IMAGE_FORMATS)
        image = next(s for s in data["streams"] if s["codec_type"] == "video")
        width, height, codec = int(image["width"]), int(image["height"]), image["codec_name"]
        if codec not in IMAGE_TYPES:
            raise ValueError("Unsupported image codec")
        if width <= 0 or height <= 0 or width > 8192 or height > 8192:
            raise HTTPException(422, "Choose an image up to 8192 pixels on each side.")
        still(
            source,
            thumbnail,
            settings,
            IMAGE_FORMATS,
            "[0:v]scale=640:360:force_original_aspect_ratio=decrease,format=yuvj420p",
        )
        return {
            "duration": 0.0,
            "width": width,
            "height": height,
            "codec": codec,
            "content_type": IMAGE_TYPES[codec],
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
            422, "We couldn’t read this image. Choose a JPG, PNG, WebP or GIF."
        ) from None


def inspect_audio(source: Path, thumbnail: Path, settings: Settings):
    try:
        data = probe(source, settings, AUDIO_FORMATS)
        audio = next(s for s in data["streams"] if s["codec_type"] == "audio")
        duration = float(data["format"].get("duration", audio.get("duration", 0)))
        if not math.isfinite(duration) or duration <= 0 or duration > settings.max_audio_seconds:
            raise HTTPException(
                422, f"Choose audio up to {settings.max_audio_seconds // 60} minutes long."
            )
        names = set(data["format"]["format_name"].split(","))
        content_type = next((AUDIO_TYPES[n] for n in names if n in AUDIO_TYPES), "audio/mp4")
        # A waveform stands in for a picture.
        still(
            source,
            thumbnail,
            settings,
            AUDIO_FORMATS,
            "[0:a]aformat=channel_layouts=mono,"
            "showwavespic=s=640x200:colors=0xFF385C:filter=peak:scale=sqrt[w];"
            "color=c=0xF7F7F7:s=640x360[bg];[bg][w]overlay=0:80:shortest=1,format=yuvj420p",
        )
        return {
            "duration": duration,
            "width": 0,
            "height": 0,
            "codec": audio.get("codec_name", "")[:40],
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
            422, "We couldn’t read this audio. Choose an MP3, WAV, M4A, AAC, OGG or FLAC file."
        ) from None


def inspect_document(source: Path, thumbnail: Path, settings: Settings):
    head = source.read_bytes()
    if source.suffix.lower() == ".pdf":
        if not head.startswith(b"%PDF-"):
            raise HTTPException(422, "This PDF looks damaged. Export it again and retry.")
        content_type, codec = "application/pdf", "pdf"
    else:
        try:
            if b"\x00" in head:
                raise UnicodeDecodeError("utf-8", head, 0, 1, "binary")
            head.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(422, "Save text documents as UTF-8 and try again.") from None
        content_type, codec = "text/plain; charset=utf-8", "text"
    ffmpeg, _ = media_tools(settings)
    try:
        subprocess.run(
            [
                ffmpeg,
                "-nostdin",
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "color=c=0xF2F2F2:s=640x360:d=1",
                "-frames:v",
                "1",
                "-update",
                "1",
                str(thumbnail),
            ],
            capture_output=True,
            timeout=15,
            check=True,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        raise HTTPException(503, "Media tools failed on the API host. Try again.") from None
    return {"duration": 0.0, "width": 0, "height": 0, "codec": codec, "content_type": content_type}


def inspect_asset(kind: str, source: Path, thumbnail: Path, settings: Settings):
    inspect = {
        "video": inspect_media,
        "image": inspect_image,
        "audio": inspect_audio,
        "document": inspect_document,
    }[kind]
    return inspect(source, thumbnail, settings)


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
