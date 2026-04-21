"""Todos router.

Endpoints:
  GET    /api/py/todos        list, sorted by position
  POST   /api/py/todos        create (server mints uuid, stamps updated_at)
  PATCH  /api/py/todos/{id}   partial update (label/done/position)
  DELETE /api/py/todos/{id}   delete

RLS enforces ``auth.uid() = user_id`` on every query; we trust it and do not
double-check ownership in the handler.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from api._auth import AuthCtx, get_auth

router = APIRouter(tags=["todos"])


class TodoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=500)
    done: bool = False
    position: int = Field(ge=0)


class TodoPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str | None = Field(default=None, min_length=1, max_length=500)
    done: bool | None = None
    position: int | None = Field(default=None, ge=0)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/todos")
def list_todos(auth: AuthCtx = Depends(get_auth)) -> list[dict[str, Any]]:
    resp = (
        auth.client.table("todos")
        .select("*")
        .order("position", desc=False)
        .execute()
    )
    return resp.data or []


@router.post("/todos", status_code=status.HTTP_201_CREATED)
def create_todo(
    body: TodoCreate,
    auth: AuthCtx = Depends(get_auth),
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "user_id": auth.user_id,
        "label": body.label,
        "done": body.done,
        "position": body.position,
        "updated_at": _now_iso(),
    }
    resp = auth.client.table("todos").insert(payload).execute()
    rows = resp.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Insert returned no row.",
        )
    return rows[0]


@router.patch("/todos/{todo_id}")
def patch_todo(
    todo_id: str,
    body: TodoPatch,
    auth: AuthCtx = Depends(get_auth),
) -> dict[str, Any]:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields supplied to update.",
        )
    updates["updated_at"] = _now_iso()
    resp = (
        auth.client.table("todos")
        .update(updates)
        .eq("id", todo_id)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        # Either missing or filtered out by RLS — surface as 404 either way.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found.",
        )
    return rows[0]


@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    auth: AuthCtx = Depends(get_auth),
) -> None:
    resp = auth.client.table("todos").delete().eq("id", todo_id).execute()
    if not (resp.data or []):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found.",
        )
    return None
