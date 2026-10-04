"""Render a validated edit document; preserve that document and layers in the package."""

import base64
import json
import textwrap
import zipfile
from html import escape

from creatorai.ai import ProviderError
from creatorai.demo_schemas import ClipDocument
from creatorai.media import IMAGE_FORMATS, media_tools, probe
from creatorai.understanding import command

PRESETS = {
    "youtube_shorts": (720, 1280),
    "instagram_reel": (720, 1280),
    "tiktok": (720, 1280),
    "youtube_video": (1280, 720),
    "square_post": (720, 720),
}
HOOK_SECONDS = 3.0


def timestamp(seconds):
    millis = round(max(0, seconds) * 1000)
    return (
        f"{millis // 3600000:02}:{millis // 60000 % 60:02}:"
        f"{millis // 1000 % 60:02},{millis % 1000:03}"
    )


def plain(text):
    # Remove ASS override and HTML markup characters from creator-written text.
    text = text.replace("\\", "").replace("{", "").replace("}", "")
    return text.replace("<", "").replace(">", "").replace("\r", " ").replace("\n", " ")


def subtitles(document):
    entries = []
    for segment in document.subtitle_segments:
        start, end = max(segment.start, document.start), min(segment.end, document.end)
        if end <= start:
            continue
        chunks = textwrap.wrap(plain(segment.text), width=34)
        pairs = ["\n".join(chunks[i : i + 2]) for i in range(0, len(chunks), 2)]
        for i, pair in enumerate(pairs):
            a = start + (end - start) * i / len(pairs) - document.start
            b = start + (end - start) * (i + 1) / len(pairs) - document.start
            entries.append(f"{len(entries) + 1}\n{timestamp(a)} --> {timestamp(b)}\n{pair}\n")
    return "\n".join(entries)


def hook_track(document):
    """The opening hook as on-screen text over the first seconds of the cut."""
    text = plain(document.hook).strip()
    if not text:
        return ""
    end = min(HOOK_SECONDS, document.end - document.start)
    lines = "\n".join(textwrap.wrap(text, width=26)[:3])
    return f"1\n{timestamp(0)} --> {timestamp(end)}\n{lines}\n"


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


def cover_image(image, folder, settings):
    """Fit a project image into the cover's picture area as a JPEG."""
    ffmpeg, _ = media_tools(settings)
    target = folder / "cover-image.jpg"
    command(
        [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            "-protocol_whitelist",
            "file,pipe",
            "-format_whitelist",
            IMAGE_FORMATS,
            "-i",
            str(image.resolve()),
            "-vf",
            "scale=720:640:force_original_aspect_ratio=increase,crop=720:640,format=yuvj420p",
            "-frames:v",
            "1",
            "-update",
            "1",
            str(target),
        ]
    )
    return target


def render(
    source,
    folder,
    settings,
    document,
    preset,
    source_metadata=None,
    music=None,
    cover_source=None,
):
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
    hook = hook_track(document)
    if hook:
        (folder / "hook.srt").write_text(hook, encoding="utf-8")
        # SRT force_style takes legacy SSA alignment: 6 is top center.
        filters += (
            ",subtitles=hook.srt:force_style='Fontname=DejaVu Sans,Fontsize=22,Bold=1,"
            "Alignment=6,MarginV=60'"
        )
    video = folder / "video.mp4"
    inputs = ["-protocol_whitelist", "file,pipe", "-ss", str(document.start)]
    inputs += ["-i", str(source.resolve())]
    if music and document.music:
        # A looping music bed under the cut's own sound (or alone, if the footage is silent).
        streams = probe(source, settings, "mov,matroska,webm")["streams"]
        speech = any(s["codec_type"] == "audio" for s in streams)
        inputs += ["-protocol_whitelist", "file,pipe", "-stream_loop", "-1"]
        inputs += ["-i", str(music.resolve())]
        bed = f"[1:a:0]volume={document.music.volume:.3f}"
        mix = f"{bed}[m];[0:a:0][m]amix=inputs=2:duration=first:normalize=0[a]"
        maps = [
            "-filter_complex",
            f"[0:v:0]{filters}[v];" + (mix if speech else f"{bed}[a]"),
            "-map",
            "[v]",
            "-map",
            "[a]",
        ]
    else:
        maps = ["-map", "0:v:0", "-map", "0:a?", "-vf", filters]
    command(
        [
            ffmpeg,
            "-nostdin",
            "-v",
            "error",
            *inputs,
            "-t",
            str(document.end - document.start),
            *maps,
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
        if hook:
            archive.writestr("hook.srt", hook)
        archive.writestr("caption.txt", document.platform_captions.get(preset) or document.caption)
        picture = cover_image(cover_source, folder, settings) if cover_source else thumb
        archive.writestr("cover.svg", cover_svg(document, picture))
    return video, package
