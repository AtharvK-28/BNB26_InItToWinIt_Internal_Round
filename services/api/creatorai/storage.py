import hashlib
import hmac
import time
from pathlib import Path
from urllib.parse import quote

import httpx

from creatorai.config import Settings


class LocalStorage:
    def __init__(self, settings: Settings):
        self.root = settings.data_dir / "media"
        self.secret = settings.media_signing_secret.get_secret_value().encode()

    def path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        path.relative_to(self.root.resolve())
        return path

    def put(self, key: str, source: Path, content_type: str):
        import shutil

        path = self.path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("xb") as target, source.open("rb") as original:
            shutil.copyfileobj(original, target, 1024 * 1024)

    def delete(self, key: str):
        self.path(key).unlink(missing_ok=True)

    def download(self, key: str, target: Path, limit: int):
        import shutil

        source = self.path(key)
        if source.stat().st_size > limit:
            raise ValueError("Stored media exceeds the limit")
        shutil.copyfile(source, target)

    def link(self, key: str, asset_id: str, kind: str) -> str:
        expires = int(time.time()) + 300
        signature = self.sign(asset_id, kind, expires)
        return f"/media/{asset_id}/{kind}?expires={expires}&signature={signature}"

    def sign(self, asset_id: str, kind: str, expires: int) -> str:
        return hmac.new(
            self.secret, f"{asset_id}:{kind}:{expires}".encode(), hashlib.sha256
        ).hexdigest()

    def verify(self, asset_id: str, kind: str, expires: int, signature: str) -> bool:
        return int(time.time()) <= expires <= int(time.time()) + 301 and hmac.compare_digest(
            self.sign(asset_id, kind, expires), signature
        )


class SupabaseStorage:
    def __init__(self, settings: Settings):
        self.base = settings.supabase_url.rstrip("/") + "/storage/v1"
        self.bucket = settings.storage_bucket
        token = settings.supabase_service_role_key.get_secret_value()
        self.headers = {"apikey": token, "Authorization": f"Bearer {token}"}

    def object_path(self, key: str):
        return quote(f"{self.bucket}/{key}", safe="/")

    def put(self, key: str, source: Path, content_type: str):
        def chunks():
            with source.open("rb") as file:
                while chunk := file.read(1024 * 1024):
                    yield chunk

        with httpx.Client(timeout=45) as client:
            response = client.post(
                f"{self.base}/object/{self.object_path(key)}",
                content=chunks(),
                headers={
                    **self.headers,
                    "Content-Type": content_type,
                    "Content-Length": str(source.stat().st_size),
                    "x-upsert": "false",
                },
            )
            response.raise_for_status()

    def delete(self, key: str):
        with httpx.Client(timeout=15) as client:
            response = client.request(
                "DELETE",
                f"{self.base}/object/{quote(self.bucket)}",
                headers=self.headers,
                json={"prefixes": [key]},
            )
            response.raise_for_status()

    def download(self, key: str, target: Path, limit: int):
        size = 0
        with httpx.Client(timeout=60) as client:
            with client.stream(
                "GET",
                f"{self.base}/object/authenticated/{self.object_path(key)}",
                headers=self.headers,
            ) as response:
                response.raise_for_status()
                with target.open("xb") as file:
                    for chunk in response.iter_bytes(1024 * 1024):
                        size += len(chunk)
                        if size > limit:
                            raise ValueError("Stored media exceeds the limit")
                        file.write(chunk)

    def link(self, key: str, asset_id: str, kind: str):
        with httpx.Client(timeout=15) as client:
            response = client.post(
                f"{self.base}/object/sign/{self.object_path(key)}",
                headers=self.headers,
                json={"expiresIn": 300},
            )
            response.raise_for_status()
            signed = response.json().get("signedURL")
            if not isinstance(signed, str) or not signed.startswith("/object/sign/"):
                raise ValueError("Unexpected storage response")
            return self.base + signed


def make_storage(settings: Settings):
    return (
        SupabaseStorage(settings)
        if settings.storage_backend == "supabase"
        else LocalStorage(settings)
    )
