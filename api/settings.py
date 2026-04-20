"""Settings router.

Exposes ``GET /api/py/settings`` and ``PUT /api/py/settings``. Queries run
through a supabase-py client that carries the caller's JWT so Row-Level
Security restricts rows to ``auth.uid() = user_id``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from supabase import Client

from api._auth import get_supabase_client, get_user_id

router = APIRouter(tags=["settings"])


class SettingsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pomodoro_min: int = Field(default=25, ge=1, le=240)
    short_min: int = Field(default=5, ge=1, le=240)
    long_min: int = Field(default=15, ge=1, le=240)
    theme: str = Field(default="seoul")
    alert_sound: str = Field(default="bell")
    alert_volume: float = Field(default=0.6, ge=0.0, le=1.0)
    alert_enabled: bool = Field(default=True)
    notifications_enabled: bool = Field(default=False)
    spotify_enabled: bool = Field(default=True)


@router.get("/settings")
def get_settings(
    client: Client = Depends(get_supabase_client),
) -> dict[str, Any]:
    resp = client.table("settings").select("*").limit(1).execute()
    rows = resp.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No settings row for this user.",
        )
    return rows[0]


@router.put("/settings")
def put_settings(
    body: SettingsBody,
    client: Client = Depends(get_supabase_client),
    user_id: str = Depends(get_user_id),
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "user_id": user_id,
        **body.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    resp = (
        client.table("settings")
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
