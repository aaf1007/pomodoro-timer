-- Supabase schema for the Aesthetic Pomodoro Timer.
-- Run this in the Supabase SQL editor for your project.
-- Both tables are protected by Row-Level Security using auth.uid() = user_id.

create table settings (
  user_id uuid primary key references auth.users on delete cascade,
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
  user_id uuid not null references auth.users on delete cascade,
  label text not null,
  done boolean default false,
  position int not null,
  updated_at timestamptz default now()
);

-- Read-path index: todos are queried per user, ordered by position.
create index todos_user_id_position_idx on todos (user_id, position);

-- Row-Level Security
alter table settings enable row level security;
alter table todos enable row level security;

-- settings policies
create policy "settings_select_own"
  on settings for select
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on settings for insert
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "settings_delete_own"
  on settings for delete
  using (auth.uid() = user_id);

-- todos policies
create policy "todos_select_own"
  on todos for select
  using (auth.uid() = user_id);

create policy "todos_insert_own"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "todos_update_own"
  on todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "todos_delete_own"
  on todos for delete
  using (auth.uid() = user_id);
