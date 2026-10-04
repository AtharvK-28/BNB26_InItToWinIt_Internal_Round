from uuid import UUID

import jwt
from fastapi import Header, HTTPException, Request

from creatorai.config import LOCAL_OWNER, Settings


class TokenVerifier:
    def __init__(self, settings: Settings):
        self.issuer = settings.supabase_url.rstrip("/") + "/auth/v1"
        self.keys = jwt.PyJWKClient(self.issuer + "/.well-known/jwks.json", lifespan=300, timeout=8)

    def verify(self, token: str) -> str:
        try:
            key = self.keys.get_signing_key_from_jwt(token).key
            claims = jwt.decode(
                token,
                key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
                issuer=self.issuer,
                options={"require": ["exp", "sub", "iss", "aud"]},
            )
            if claims.get("role") != "authenticated":
                raise ValueError("Unsupported role")
            return str(UUID(claims["sub"]))
        except (jwt.PyJWTError, ValueError, TypeError):
            raise HTTPException(401, "Your session has ended. Sign in to keep working.") from None


def get_owner(request: Request, authorization: str | None = Header(default=None)) -> str:
    if request.app.state.settings.app_mode == "local":
        return LOCAL_OWNER
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to open your workspace.")
    return request.app.state.verifier.verify(authorization[7:])
