"""FastAPI entrypoint for the Aesthetic Pomodoro Timer backend.

Mounted under ``/api/py`` via the rewrite in ``next.config.ts``. On Vercel,
files in ``api/`` are deployed as Python serverless functions; ``app`` here is
the ASGI handler picked up by the Vercel Python runtime. Locally, run with:

    uvicorn api.index:app --reload --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI

from api.settings import router as settings_router
from api.todos import router as todos_router

app = FastAPI(title="Aesthetic Pomodoro Timer API")


@app.get("/api/py/health")
def health() -> dict[str, bool]:
    return {"ok": True}


app.include_router(settings_router, prefix="/api/py")
app.include_router(todos_router, prefix="/api/py")
