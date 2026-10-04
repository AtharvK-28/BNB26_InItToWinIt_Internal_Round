"""Bound multipart requests before Starlette spools uploaded files to disk."""

from threading import BoundedSemaphore

from starlette.formparsers import MultiPartException
from starlette.responses import JSONResponse


class UploadLimit:
    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes
        self.slots = BoundedSemaphore(2)

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        is_upload = (
            scope["type"] == "http"
            and scope["method"] == "POST"
            and path.startswith("/projects/")
            and path.endswith("/assets")
        )
        if not is_upload:
            return await self.app(scope, receive, send)
        headers = dict(scope.get("headers", []))
        try:
            length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            return await JSONResponse({"detail": "Invalid upload length."}, 400)(
                scope, receive, send
            )
        error = JSONResponse({"detail": "This clip is too large. Choose a file under 40 MB."}, 413)
        if length > self.max_bytes:
            return await error(scope, receive, send)
        if not self.slots.acquire(blocking=False):
            return await JSONResponse(
                {"detail": "Two clips are being imported. Try again once one finishes."}, 503
            )(scope, receive, send)
        size, exceeded, replaced = 0, False, False

        async def limited_receive():
            nonlocal size, exceeded
            message = await receive()
            if message["type"] == "http.request":
                size += len(message.get("body", b""))
                if size > self.max_bytes:
                    exceeded = True
                    # MultipartParser handles this exception by closing its temporary files.
                    raise MultiPartException("Upload limit exceeded")
            return message

        async def limited_send(message):
            nonlocal replaced
            if exceeded:
                if message["type"] == "http.response.start" and not replaced:
                    replaced = True
                    await error(scope, receive, send)
                return
            await send(message)

        try:
            await self.app(scope, limited_receive, limited_send)
        finally:
            self.slots.release()
