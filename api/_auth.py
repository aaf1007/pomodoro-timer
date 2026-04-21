"""Auth helpers for the FastAPI backend.

Extracts the user's Supabase JWT from the ``Authorization`` header and returns
a supabase-py client that carries the token so queries execute under that
user's Row-Level Security identity.

We read ``sub`` from the JWT without verifying the signature because RLS on
every table enforces ``auth.uid() = user_id`` — a forged claim cannot read
another user's rows. Signature verification is Supabase's job; ours is just to
surface the caller identity for write payloads.
"""

from __future__ import annotations

import base64
import json
import os
from functools import lru_cache
from typing import NamedTuple

from fastapi import Header, HTTPException, status
from supabase import Client, create_client


class AuthCtx(NamedTuple):
    client: Client
    user_id: str


def _missing_env(name: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Server misconfigured: {name} is not set.",
    )


@lru_cache(maxsize=1)
def _supabase_config() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL")
    anon_key = os.environ.get("SUPABASE_ANON_KEY")
    if not url:
        raise _missing_env("SUPABASE_URL")
    if not anon_key:
        raise _missing_env("SUPABASE_ANON_KEY")
    return url, anon_key


def _parse_bearer(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be 'Bearer <jwt>'.",
        )
    return parts[1]


def _unverified_sub(token: str) -> str | None:
    # JWT = base64url(header).base64url(payload).signature. We only need `sub`
    # from the payload; signature verification is Supabase's job (enforced via
    # RLS downstream). Parsing without verification here keeps us off heavy
    # crypto deps for a one-field read.
    parts = token.split(".")
    if len(parts) != 3:
        return None
    payload = parts[1]
    padding = "=" * (-len(payload) % 4)
    try:
        decoded = base64.urlsafe_b64decode(payload + padding)
        claims = json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return None
    sub = claims.get("sub") if isinstance(claims, dict) else None
    return sub if isinstance(sub, str) and sub else None


def get_auth(authorization: str | None = Header(default=None)) -> AuthCtx:
    token = _parse_bearer(authorization)
    user_id = _unverified_sub(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject.",
        )
    url, anon_key = _supabase_config()
    client: Client = create_client(url, anon_key)
    client.postgrest.auth(token)
    return AuthCtx(client=client, user_id=user_id)
