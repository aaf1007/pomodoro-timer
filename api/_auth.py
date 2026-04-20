"""Auth helpers for the FastAPI backend.

Extracts the user's Supabase JWT from the ``Authorization`` header and returns
a supabase-py client that carries the token so queries execute under that
user's Row-Level Security identity. We deliberately do NOT verify the JWT
ourselves — we delegate to Supabase so RLS handles user isolation.
"""

from __future__ import annotations

import os
from functools import lru_cache

from fastapi import Header, HTTPException, status
from supabase import Client, create_client


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


def get_supabase_client(authorization: str | None = Header(default=None)) -> Client:
    """FastAPI dependency returning a supabase-py client bound to the user's JWT.

    The client is constructed with the anon key, then the access token is
    attached via PostgREST headers so RLS policies evaluate ``auth.uid()``
    against the caller.
    """
    token = _parse_bearer(authorization)
    url, anon_key = _supabase_config()
    client: Client = create_client(url, anon_key)
    # Attach the user's JWT so PostgREST requests run as that user under RLS.
    client.postgrest.auth(token)
    return client


def get_user_id(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency returning the authenticated user's uuid.

    Uses supabase-py's ``auth.get_user`` which validates the token against
    Supabase. Avoids parsing/verifying JWTs ourselves.
    """
    token = _parse_bearer(authorization)
    url, anon_key = _supabase_config()
    client: Client = create_client(url, anon_key)
    try:
        user_resp = client.auth.get_user(token)
    except Exception as exc:  # network or validation failure
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc
    user = getattr(user_resp, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
    return user.id
