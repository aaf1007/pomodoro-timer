# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aesthetic Pomodoro timer app — desktop-only, anonymous-by-default, optionally synced to Supabase. Reference design: studywithme.io. See `PRD.md` for full v1 spec and phased execution plan; `README.md` for current-status summary.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**
- **Jest 30** + **@testing-library/react** (jsdom) for unit tests
- **pnpm** as the package manager
- **Space Grotesk** via `@fontsource/space-grotesk`

Planned (not yet in the tree — see "Planned" section below): FastAPI, Supabase, `@supabase/ssr`.

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
```

Jest is configured via `next/jest` (`jest.config.ts`). The `@/` alias maps to the repo root, so imports mirror app code (`import { ... } from "@/lib/..."`). Setup file: `jest.setup.ts`.

**Parallel-safe (run together):** `pnpm typecheck` + `pnpm lint` + `pnpm test` — independent, no shared output.

**Must run sequentially:** `pnpm build` before any deploy.

## Architecture (implemented)

**Single-page app.** `app/page.tsx` is the only route. `app/layout.tsx` wires fonts + metadata. No API routes yet.

**Timer engine (`lib/timer/useTimer.ts`).** Drift-safe: on `start` it captures `endsAt = Date.now() + remainingMs` in a ref, then a `requestAnimationFrame` loop recomputes `remaining = endsAt - Date.now()` and calls `setRemaining` at most every 250 ms. Do **not** reintroduce `setInterval`-style decrement. When `remaining` hits 0 the loop fires `onSessionEnd(mode)`, advances the sequence, and pre-loads the next mode's duration.

**Sequence state machine (`lib/timer/sequence.ts`).** State is `{ mode, pomosDoneInCycle }`. Transitions: `pom → short`, or `pom → long` when the completed pom was the 4th (then `pomosDoneInCycle` resets to 0); `short | long → pom`. Progress dots in `components/ModePills.tsx` read `pomosDoneInCycle`.

**Tab title (`lib/tabTitle.ts` + `lib/timer/useTabTitle.ts`).** While running: `document.title = \`${mm}:${ss} · ${modeLabel}\``. When paused/stopped or on unmount, restore to `study-with-ant.io`. The title is written reactively whenever `remaining` changes — no separate interval. Favicon swap is **not** implemented yet (planned in PRD).

**Audio & notifications.**
- `lib/audio.ts` — preloaded alert sounds from `public/sounds/`.
- `lib/notifications.ts` — Notification API; only request permission the first time a user explicitly enables notifications, never on page load.

**Themes (`lib/themes.ts` + `components/BackgroundLayer.tsx` + `components/ThemeSelector.tsx`).** Manifest of four themes (seoul, tokyo, paris, fire), each with a `.webm` video and `.jpg` poster under `public/bg/`. `BackgroundLayer` crossfades between the current and next theme; `next` is derived from props, not local state (see commit `5cdb4cd` — do not reintroduce a local `next` state, it broke interrupted transitions). Videos must be `playsInline muted loop autoPlay`. Max 3 MB per compressed video.

**Todos & local persistence.** `components/TodoPanel.tsx` + `lib/storage/local.ts`. Anonymous users persist settings and todos to `localStorage` via the shapes in `local.ts`.

**Tests.** Colocated next to source (`lib/*.test.ts`) and in `__tests__/` for components. Patterns: React Testing Library for components, plain Jest for pure libs. `jest.setup.ts` pulls in `@testing-library/jest-dom`.

## Architecture (planned — not in tree yet)

The `supabase` worktree exists to land these. Don't reference them as present-tense in code or commits until they ship.

- **FastAPI routes** under `/api/py/*` (Next.js rewrites in `next.config.ts` already point to `http://127.0.0.1:8000/api/py/:path*`). `api/index.py` entrypoint; `api/settings.py`, `api/todos.py` handlers. On Vercel, `api/*.py` deploys as Python serverless functions.
- **Supabase auth + DB.** Browser client `lib/supabase/client.ts`; server client `lib/supabase/server.ts`; session refresh via root `middleware.ts` wrapping `lib/supabase/middleware.ts`. Schema in `supabase/schema.sql` with RLS on `settings` and `todos`.
- **Cloud sync (`lib/storage/sync.ts`).** Last-write-wins per field using `updated_at`. On first sign-in, prompt the user to keep cloud / overwrite / merge (default = merge).
- **Favicon countdown.** `<canvas>` → dataURL → `<link rel="icon">` swap each second while running.
- **Remaining UI:** `SettingsModal.tsx` (Timer / Sounds / General / Account tabs), `MusicEmbed.tsx` (collapsible Spotify/YouTube lofi iframe).

## Quality gates

Before shipping: `pnpm typecheck`, `pnpm lint`, `pnpm test`, Lighthouse a11y ≥ 90, background video ≤ 3 MB compressed.
