"""Settings router.

Exposes ``GET /api/py/settings`` and ``PUT /api/py/settings``. Queries run
through a supabase-py client that carries the caller's JWT so Row-Level
Security restricts rows to ``auth.uid() = user_id``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from api._auth import AuthCtx, get_auth

router = APIRouter(tags=["settings"])

Theme = Literal["seoul", "tokyo", "paris", "fire"]
AlertSound = Literal["bell", "chime", "birds", "lofi"]


class SettingsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pomodoro_min: int = Field(default=25, ge=1, le=240)
    short_min: int = Field(default=5, ge=1, le=240)
    long_min: int = Field(default=15, ge=1, le=240)
    theme: Theme = "seoul"
    alert_sound: AlertSound = "bell"
    alert_volume: float = Field(default=0.6, ge=0.0, le=1.0)
    alert_enabled: bool = Field(default=True)
    notifications_enabled: bool = Field(default=False)
    spotify_enabled: bool = Field(default=True)


@router.get("/settings")
def get_settings(auth: AuthCtx = Depends(get_auth)) -> dict[str, Any] | None:
    # Brand-new users have no row until the first PUT. Surface that as null
    # rather than 404 so callers can treat "no remote settings" as "nothing
    # to merge" without branching on an error.
    resp = auth.client.table("settings").select("*").limit(1).execute()
    rows = resp.data or []
    return rows[0] if rows else None


@router.put("/settings")
def put_settings(
    body: SettingsBody,
    auth: AuthCtx = Depends(get_auth),
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "user_id": auth.user_id,
        **body.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    resp = (
        auth.client.table("settings")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    rows = resp.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upsert returned no row.",
        )
    return rows[0]
