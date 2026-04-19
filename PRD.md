# Aesthetic Pomodoro Timer — v1 PRD

## Context

Recreate the look and feel of [studywithme.io's aesthetic pomodoro timer](https://studywithme.io/aesthetic-pomodoro-timer/) as our own, with video backgrounds, todos, and cloud-synced settings. The repo currently has an `Initial commit from Create Next App` scaffold recorded in git, but the working tree is empty — so we rescaffold fresh.

Goal: a focused, desktop-only Pomodoro page that is anonymous-usable out of the box and optionally syncs across devices via a Supabase account. One page, no landing site, no stats.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **FastAPI** (Python) for all API routes, proxied via Next.js rewrites at `/api/py/*`
- **Supabase** for auth + Postgres + Row-Level Security
- **Vercel** for deploy (FastAPI deploys as Python serverless functions)
- **Space Grotesk** via `@fontsource/space-grotesk` (matches reference)

## Scope — v1 features

Core timer
- 3 modes: Pomodoro / Short Break / Long Break (defaults 25/5/15, configurable)
- Start / Pause / Reset
- Auto-sequence: 4 pomodoros → short break between each → long break, then repeat. Progress dots under "Pomodoro" pill.

Aesthetic
- 4 themes with looping video backgrounds: **Seoul Sunrise**, **Tokyo Sakura**, **Rainy Paris**, **Cozy Fireplace**. CC0/free-stock `.webm` + poster `.jpg` per theme, curated from Pexels/Coverr/Pixabay.
- Theme picker in settings modal.

Side features
- Right-rail todo list (add / check / delete), persisted.
- Alert sounds (Bell / Chime / Birds / Lofi) with volume slider, CC0 samples from freesound.org in `/public/sounds/`.
- Browser notifications on session end (permission requested on first start after toggle).
- Collapsible Spotify/YouTube lofi iframe in bottom-left.
- Live tab-title countdown + favicon swap while timer runs.

Persistence
- **Anonymous by default**, backed by `localStorage`.
- Optional Supabase sign-in (email + password via `@supabase/ssr`). On first sign-in, local state migrates to cloud.
- Multi-device conflict resolution: **last-write-wins per field**, using `updated_at` timestamps.

Out of scope for v1: mobile-responsive, landing page, stats/streaks, keyboard shortcuts, account-sharing, Pomodoro Technique® trademarks page.

## File structure

```
app/
  layout.tsx                       # fonts, metadata, Supabase session provider
  page.tsx                         # the timer page
  globals.css                      # Tailwind + theme CSS vars
api/
    index.py                       # FastAPI app entrypoint
    settings.py                    # GET/PUT user settings (cloud)
    todos.py                       # GET/POST/PATCH/DELETE todos
components/
  Timer.tsx                        # mode pills, digits, controls, drift-safe tick loop
  ModePills.tsx                    # Pomodoro / Short / Long with progress dots
  Controls.tsx                     # start / reset / settings
  SettingsModal.tsx                # Timer / Sounds / General / Account tabs
  TodoPanel.tsx                    # right-rail list
  BackgroundLayer.tsx              # <video> loop + poster + theme switch crossfade
  MusicEmbed.tsx                   # collapsible Spotify/YouTube iframe
  AuthButton.tsx                   # sign in / sign out UI in settings
lib/
  supabase/
    client.ts                      # browser client
    server.ts                      # server client (cookies)
    middleware.ts                  # session refresh
  timer/
    useTimer.ts                    # hook: drift-safe via Date.now() delta + rAF
    sequence.ts                    # auto-advance logic (pom→short, 4x→long)
  storage/
    local.ts                       # localStorage shape + migrations
    sync.ts                        # pull/push + LWW merge with cloud
  themes.ts                        # theme manifest (id, label, video, poster, accent)
  notifications.ts                 # Notification API wrapper
  audio.ts                         # alert sound preload + play + volume
public/
  bg/{seoul,tokyo,paris,fire}.{webm,jpg}
  sounds/{bell,chime,birds,lofi}.mp3
  favicons/ (generated from countdown)
supabase/
  schema.sql                       # users profile, settings, todos + RLS
middleware.ts                      # Supabase session refresh wrapper
requirements.txt                   # FastAPI, uvicorn, supabase-py, python-jose
```

## Key implementation details

**FastAPI proxy.** `next.config.ts` rewrites `/api/py/:path*` → `http://127.0.0.1:8000/api/py/:path*` in dev. On Vercel, the `/api/*.py` files are deployed as Python serverless functions automatically. Frontend calls always use `/api/py/settings` and `/api/py/todos` — no origin change needed.

**Drift-safe timer.** Don't decrement a counter in `setInterval`. Store `endsAt = Date.now() + remainingMs` when started; on each tick (250 ms) compute `remaining = endsAt - Date.now()`. Survives tab backgrounding and device sleep.

**Sequence state machine.** `{mode, pomosDoneInCycle}` → on timer end, pick next mode: `pom → short` (unless `pomosDoneInCycle === 4` → `long` then reset to 0), `short|long → pom`. Progress dots read `pomosDoneInCycle`.

**Background swap.** Preload next theme's poster on hover over its picker option. When selected, fade old `<video>` out, new in. `playsInline muted loop autoPlay` required for autoplay.

**Supabase schema (RLS on both tables, `auth.uid() = user_id`).**
```sql
create table settings (
  user_id uuid primary key references auth.users,
  pomodoro_min int default 25,
  short_min int default 5,
  long_min int default 15,
  theme text default 'seoul',
  alert_sound text default 'bell',
  alert_volume numeric default 0.6,
  alert_enabled boolean default true,
  notifications_enabled boolean default false,
  spotify_enabled boolean default true,
  updated_at timestamptz default now()
);

create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  label text not null,
  done boolean default false,
  position int not null,
  updated_at timestamptz default now()
);
```

**Local→cloud migration on sign-in.** If cloud `settings` row is empty, push local. Otherwise prompt: "keep cloud / overwrite with local / merge (LWW)". Default = merge.

**Tab title countdown.** When running, set `document.title = `${mm}:${ss} · Pomodoro``; on pause/reset, restore. Favicon regenerated every second via `<canvas>` → dataURL assigned to `<link rel="icon">`.

**Notifications.** Only request permission the first time a user toggles notifications ON — not on page load.

## Layout

```
[ study-with-ant.io ]                                     [ ⚙ ]
                                                           │
                                                           │  Todos
                                                           │  ─────
              [ pomodoro ] [ short break ] [ long break ]  │  □ ship v1
                                                           │  □ record lofi
                          25:00                            │  ✓ curate vids
                                                           │
                        [ start ]  ⟲  ⚙                    │  + add task
                                                           │
                                                           │
 🎵 [lofi embed]                                           │
```

## Verification

End-to-end runbook:
1. `pnpm dev`; open `http://localhost:3000`. Timer shows 25:00, pill on "Pomodoro."
2. Click **Start** → digits count down. Switch tab for 30s → return; remaining is still accurate (drift test).
3. Wait for end → alert plays, browser notification fires (if enabled), auto-advances to Short Break.
4. Repeat 4 pomodoros → after #4 auto-advances to Long Break. Dots reset.
5. Settings modal: change durations + theme → background crossfades; new durations persist across reload (localStorage).
6. Add 3 todos → check one → refresh → todos intact.
7. Sign up via Settings → Account. Cloud `settings` row created; local data migrates. Sign in from incognito → same state restored.
8. Open both tabs side-by-side, edit todos in each → latest wins per field.
9. Run `pnpm build` → no TS errors. Deploy preview to Vercel → smoke-test on live URL.

Quality gates: `pnpm typecheck`, `pnpm lint`, Lighthouse a11y ≥ 90, background video ≤ 3 MB compressed.

## Phased execution

1. [x] **Scaffold** — `create-next-app`, Tailwind, Space Grotesk, empty `Timer` stub.
2. [x] **Core timer** — drift-safe `useTimer`, mode pills, controls, sequence logic. All in-memory.
3. [ ] **Theme + backgrounds** — manifest, `BackgroundLayer`, one theme (Seoul) wired end-to-end, then the other three.
4. [ ] **Audio + notifications + tab title** — side effects on session end.
5. [ ] **Todos + localStorage** — right rail, full CRUD, persistence.
6. [ ] **Settings modal** — all tabs, bound to state.
7. [ ] **Supabase** — schema, RLS, auth UI, pull/push sync, migration prompt.
8. [ ] **Polish + Vercel deploy** — meta tags, OG image, a11y pass, compressed assets.


### Parrallel Tasks
1 -> 2 -> 3
          4 -> 6 -> 7 -> 8
          5