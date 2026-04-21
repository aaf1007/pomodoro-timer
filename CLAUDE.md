# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aesthetic Pomodoro timer app — desktop-only, anonymous-by-default, optionally synced to Supabase. Reference design: studywithme.io. See `PRD.md` for full v1 spec and phased execution plan; `README.md` for current-status summary.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**
- **Jest 30** + **@testing-library/react** (jsdom) for unit tests
- **pnpm** as the package manager
- **Space Grotesk** via `@fontsource/space-grotesk`

Backend: FastAPI (`requirements.txt`), Supabase via `@supabase/ssr` + `supabase-py`.

## Commands

```bash
pnpm dev          # next dev on localhost:3000
pnpm build        # production build
pnpm start        # serve production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint (flat config, eslint.config.mjs)
pnpm test         # jest (jsdom)
pnpm test:watch   # jest --watch

# Run a single test file:
pnpm test -- __tests__/TodoPanel.test.tsx

# Run tests matching a name:
pnpm test -- -t "drift"

# FastAPI backend (needed for /api/py/* to resolve in dev):
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

`next.config.ts` rewrites `/api/py/:path*` to `http://127.0.0.1:8000/api/py/:path*`, so dev requires both `pnpm dev` and uvicorn running. On Vercel, files in `api/` ship as Python serverless functions; `api/index.py` exposes `app` as the ASGI handler.

Backend env (FastAPI reads these; distinct from the `NEXT_PUBLIC_*` ones the browser uses): `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Frontend env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`).

Jest is configured via `next/jest` (`jest.config.ts`). The `@/` alias maps to the repo root, so imports mirror app code (`import { ... } from "@/lib/..."`). Setup file: `jest.setup.ts`.

**Parallel-safe (run together):** `pnpm typecheck` + `pnpm lint` + `pnpm test` — independent, no shared output.

**Must run sequentially:** `pnpm build` before any deploy.

## Architecture (implemented)

**Single-page app.** `app/page.tsx` is the only Next.js route. `app/layout.tsx` wires fonts + metadata. All backend calls go through FastAPI at `/api/py/*`.

**Timer engine (`lib/timer/useTimer.ts`).** Drift-safe: on `start` it captures `endsAt = Date.now() + remainingMs` in a ref, then a `requestAnimationFrame` loop recomputes `remaining = endsAt - Date.now()` and calls `setRemaining` at most every 250 ms. Do **not** reintroduce `setInterval`-style decrement. When `remaining` hits 0 the loop fires `onSessionEnd(mode)`, advances the sequence, and pre-loads the next mode's duration.

**Sequence state machine (`lib/timer/sequence.ts`).** State is `{ mode, pomosDoneInCycle }`. Transitions: `pom → short`, or `pom → long` when the completed pom was the 4th (then `pomosDoneInCycle` resets to 0); `short | long → pom`. Progress dots in `components/ModePills.tsx` read `pomosDoneInCycle`.

**Tab title (`lib/tabTitle.ts` + `lib/timer/useTabTitle.ts`).** While running: `document.title = \`${mm}:${ss} · ${modeLabel}\``. When paused/stopped or on unmount, restore to `study-with-ant.io`. The title is written reactively whenever `remaining` changes — no separate interval. Favicon swap is **not** implemented yet (planned in PRD).

**Audio & notifications.**
- `lib/audio.ts` — preloaded alert sounds from `public/sounds/`.
- `lib/notifications.ts` — Notification API; only request permission the first time a user explicitly enables notifications, never on page load.

**Themes (`lib/themes.ts` + `components/BackgroundLayer.tsx` + `components/ThemeSelector.tsx`).** Manifest of four themes (seoul, tokyo, paris, fire), each with a `.webm` video and `.jpg` poster under `public/bg/`. `BackgroundLayer` crossfades between the current and next theme; `next` is derived from props, not local state (see commit `5cdb4cd` — do not reintroduce a local `next` state, it broke interrupted transitions). Videos must be `playsInline muted loop autoPlay`. Max 3 MB per compressed video.

**Todos & local persistence.** `components/TodoPanel.tsx` + `lib/storage/local.ts`. Anonymous users persist settings and todos to `localStorage` via the shapes in `local.ts`.

**Tests.** Colocated next to source (`lib/*.test.ts`) and in `__tests__/` for components. Patterns: React Testing Library for components, plain Jest for pure libs. `jest.setup.ts` pulls in `@testing-library/jest-dom`.

## Architecture (Supabase + FastAPI)

**FastAPI entrypoint (`api/index.py`).** Mounts `api/settings.py` and `api/todos.py` under `/api/py`. Auth helper in `api/_auth.py` extracts the Supabase JWT from the `Authorization` header and hands it to a `supabase-py` client so all DB calls run under the caller's RLS identity — we deliberately do **not** verify the JWT ourselves; Supabase enforces user isolation via RLS. Adding a new route: create a FastAPI `APIRouter`, depend on `_auth.get_auth` (returns `AuthCtx = (client, user_id)`), and register it in `index.py` with `prefix="/api/py"`.

**Supabase clients.**
- Browser: `lib/supabase/client.ts` (`@supabase/ssr` `createBrowserClient`).
- Server components / route handlers: `lib/supabase/server.ts`.
- Session refresh: root `middleware.ts` delegates to `lib/supabase/middleware.ts`. The matcher **skips `/api/*`** (FastAPI owns its own auth) and static assets — don't broaden it without care.

**Schema (`supabase/schema.sql`).** Two tables, `settings` (user_id PK) and `todos` (id PK + user_id FK), both with RLS policies restricting select/insert/update/delete to `auth.uid() = user_id`. Index: `todos (user_id, position)`. Run the file in the Supabase SQL editor.

**Cloud sync (`lib/storage/sync.ts`, `cloud.ts`, `cloudTodos.ts`, `useCloudSync.ts`).** Sync is **row-level LWW** using each row's `updated_at`, not per-field — the schema only tracks timestamps per row. `mergeSettings` picks whichever row is newer; `mergeTodos` merges by `id`, preferring the newer `updated_at` and preserving local insertion order for ties. `useCloudSync` debounces pushes (`PUSH_DEBOUNCE_MS = 400`). On first sign-in, `MigrationPrompt.tsx` offers keep-cloud / overwrite-cloud / merge (default = merge). Settings pull is wired on sign-in; settings push waits on the unified settings shape (Phase 6 TODO in `useCloudSync.ts`).

**Auth UI.** `components/AuthButton.tsx` is the only auth surface — sign in / sign up / sign out. No dedicated account page.

## Still planned (not in tree)

- **Favicon countdown.** `<canvas>` → dataURL → `<link rel="icon">` swap each second while running.
- **`SettingsModal.tsx`** (Timer / Sounds / General / Account tabs) — once this lands, settings push needs to be wired per the TODO in `lib/storage/useCloudSync.ts`.
- **`MusicEmbed.tsx`** collapsible Spotify/YouTube lofi iframe.

## Quality gates

Before shipping: `pnpm typecheck`, `pnpm lint`, `pnpm test`, Lighthouse a11y ≥ 90, background video ≤ 3 MB compressed.
