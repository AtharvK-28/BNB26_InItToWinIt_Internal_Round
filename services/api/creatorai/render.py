"""Render a validated edit document; preserve that document and layers in the package."""

import base64
import json
import textwrap
import zipfile
from html import escape

from creatorai.ai import ProviderError
from creatorai.demo_schemas import ClipDocument
from creatorai.media import media_tools
from creatorai.understanding import command

PRESETS = {
    "youtube_shorts": (720, 1280),
    "instagram_reel": (720, 1280),
    "youtube_video": (1280, 720),
}


def timestamp(seconds):
    millis = round(max(0, seconds) * 1000)
    return (
        f"{millis // 3600000:02}:{millis // 60000 % 60:02}:"
        f"{millis // 1000 % 60:02},{millis % 1000:03}"
    )


def subtitles(document):
    entries = []
    for segment in document.subtitle_segments:
        start, end = max(segment.start, document.start), min(segment.end, document.end)
        if end <= start:
            continue
        # Remove ASS override and HTML markup characters from creator caption text.
        text = segment.text.replace("\\", "").replace("{", "").replace("}", "")
        text = text.replace("<", "").replace(">", "").replace("\r", " ").replace("\n", " ")
        chunks = textwrap.wrap(text, width=34)
        pairs = ["\n".join(chunks[i : i + 2]) for i in range(0, len(chunks), 2)]
        for i, pair in enumerate(pairs):
            a = start + (end - start) * i / len(pairs) - document.start
            b = start + (end - start) * (i + 1) / len(pairs) - document.start
            entries.append(f"{len(entries) + 1}\n{timestamp(a)} --> {timestamp(b)}\n{pair}\n")
    return "\n".join(entries)


def cover_svg(document, thumbnail):
    cover = document.cover
    colors = {
        "paper": ("#f6f4ef", "#282b27"),
        "coral": ("#ad432f", "#fffaf4"),
        "ink": ("#282b27", "#fffaf4"),
    }
    background, foreground = colors[cover.theme]
    image = base64.b64encode(thumbnail.read_bytes()).decode()
    lines = textwrap.wrap(cover.title or document.title, 21)[:5]
    text = "".join(
        f'<tspan x="{cover.title_x * 720:.0f}" dy="{0 if i == 0 else 64}">{escape(line)}</tspan>'
        for i, line in enumerate(lines)
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" '
        f'viewBox="0 0 720 1280"><rect width="720" height="1280" fill="{background}"/>'
        f'<image href="data:image/jpeg;base64,{image}" width="720" height="640" '
        f'preserveAspectRatio="xMidYMid slice"/>'
        f'<text id="title-layer" x="{cover.title_x * 720:.0f}" '
        f'y="{cover.title_y * 1280:.0f}" fill="{foreground}" '
        f'font-family="sans-serif" font-size="56" font-weight="700">{text}</text>'
        f'<text id="subtitle-layer" x="{cover.subtitle_x * 720:.0f}" '
        f'y="{cover.subtitle_y * 1280:.0f}" fill="{foreground}" '
        f'font-family="sans-serif" font-size="24">{escape(cover.subtitle)}</text></svg>'
    )


def render(source, folder, settings, document, preset, source_metadata=None):
    document = ClipDocument.model_validate(document)
    ffmpeg, _ = media_tools(settings)
    width, height = PRESETS[preset]
    srt = subtitles(document)
    (folder / "captions.srt").write_text(srt, encoding="utf-8")
    filters = (
        f"scale={width}:{height}:force_original_aspect_ratio=increase,"
        f"crop={width}:{height}:(iw-ow)*{document.crop_x:.6f}:(ih-oh)/2,setsar=1,fps=30"
    )
    if document.subtitles and srt:
        filters += (
            ",subtitles=captions.srt:force_style='Fontname=DejaVu Sans,Fontsize=18,MarginV=40'"
        )
    video = folder / "video.mp4"
    command(
        [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-protocol_whitelist",
            "file,pipe",
            "-ss",
            str(document.start),
            "-i",
            str(source.resolve()),
            "-t",
            str(document.end - document.start),
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-vf",
            filters,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-maxrate",
            "2400k",
            "-bufsize",
            "4800k",
            "-threads",
            "2",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart",
            str(video.resolve()),
        ],
        cwd=folder,
        timeout=240,
    )
    if video.stat().st_size > 38 * 1024 * 1024:
        raise ProviderError("This export is too large for the demo. Shorten the cut and retry.")
    thumb = folder / "cover.jpg"
    command(
        [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-vf",
            "scale=720:720:force_original_aspect_ratio=decrease",
            "-threads",
            "1",
            "-update",
            "1",
            str(thumb),
        ]
    )
    package = folder / "editable-package.zip"
    with zipfile.ZipFile(package, "w", zipfile.ZIP_STORED) as archive:
        archive.write(video, "video.mp4")
        archive.writestr(
            "edit-plan.json",
            json.dumps(
                {
                    "version": 1,
                    "source": source_metadata or {},
                    "preset": preset,
                    "document": document.model_dump(),
                },
                indent=2,
            ),
        )
        archive.writestr("captions.srt", srt)
        archive.writestr("caption.txt", document.caption)
        archive.writestr("cover.svg", cover_svg(document, thumb))
    return video, package
