-- ===========================================================================
--  Nafij Netflix - Supabase schema
--  Run once in Supabase Studio -> SQL Editor -> New query -> Run.
--  Safe to re-run: every statement is idempotent.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
--  Enums
-- --------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type public.media_type as enum ('movie', 'tv');
  end if;
end
$$;

-- --------------------------------------------------------------------------
--  profiles: one row per auth user
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- Auto-create a profile row whenever a user signs up (email or OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'viewer@local'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
--  my_list: saved titles (denormalized snapshot for fast rendering)
-- --------------------------------------------------------------------------
create table if not exists public.my_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  media_type public.media_type not null,
  tmdb_id integer not null check (tmdb_id > 0),
  title text not null,
  poster_path text,
  backdrop_path text,
  release_date text,
  vote_average numeric(4, 2),
  created_at timestamptz not null default now(),
  constraint my_list_unique_entry unique (user_id, media_type, tmdb_id)
);

create index if not exists my_list_user_created_idx
  on public.my_list (user_id, created_at desc);

alter table public.my_list enable row level security;

drop policy if exists "my_list_select_own" on public.my_list;
create policy "my_list_select_own" on public.my_list
  for select using (auth.uid() = user_id);

drop policy if exists "my_list_insert_own" on public.my_list;
create policy "my_list_insert_own" on public.my_list
  for insert with check (auth.uid() = user_id);

drop policy if exists "my_list_update_own" on public.my_list;
create policy "my_list_update_own" on public.my_list
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "my_list_delete_own" on public.my_list;
create policy "my_list_delete_own" on public.my_list
  for delete using (auth.uid() = user_id);

-- --------------------------------------------------------------------------
--  watch_progress: OPTIONAL. Only needed if you set
--  NEXT_PUBLIC_WATCH_PROGRESS_ENABLED=true. Nothing else depends on it.
-- --------------------------------------------------------------------------
create table if not exists public.watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  media_type public.media_type not null,
  tmdb_id integer not null check (tmdb_id > 0),
  season_number integer,
  episode_number integer,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  updated_at timestamptz not null default now(),
  constraint watch_progress_unique_entry
    unique (user_id, media_type, tmdb_id, season_number, episode_number)
);

create index if not exists watch_progress_user_updated_idx
  on public.watch_progress (user_id, updated_at desc);

alter table public.watch_progress enable row level security;

drop policy if exists "watch_progress_select_own" on public.watch_progress;
create policy "watch_progress_select_own" on public.watch_progress
  for select using (auth.uid() = user_id);

drop policy if exists "watch_progress_insert_own" on public.watch_progress;
create policy "watch_progress_insert_own" on public.watch_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "watch_progress_update_own" on public.watch_progress;
create policy "watch_progress_update_own" on public.watch_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "watch_progress_delete_own" on public.watch_progress;
create policy "watch_progress_delete_own" on public.watch_progress
  for delete using (auth.uid() = user_id);

drop trigger if exists watch_progress_touch_updated_at on public.watch_progress;
create trigger watch_progress_touch_updated_at
  before update on public.watch_progress
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
--  Backfill profiles for users created before this schema was installed.
-- --------------------------------------------------------------------------
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'display_name',
    u.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(u.email, 'viewer@local'), '@', 1)
  )
from auth.users u
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
--  ratings: one like/dislike per user per title.
-- --------------------------------------------------------------------------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  media_type public.media_type not null,
  tmdb_id integer not null check (tmdb_id > 0),
  -- 1 = like (thumbs up), -1 = dislike (thumbs down). No neutral row is
  -- ever stored: removing a rating deletes the row instead of writing 0.
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_unique_entry unique (user_id, media_type, tmdb_id)
);

alter table public.ratings enable row level security;

drop policy if exists "ratings_select_own" on public.ratings;
create policy "ratings_select_own" on public.ratings
  for select using (auth.uid() = user_id);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own" on public.ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own" on public.ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ratings_delete_own" on public.ratings;
create policy "ratings_delete_own" on public.ratings
  for delete using (auth.uid() = user_id);

drop trigger if exists ratings_touch_updated_at on public.ratings;
create trigger ratings_touch_updated_at
  before update on public.ratings
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
--  search_history: recent search queries per user. Server-side (not
--  localStorage) so it follows the account across devices, same reasoning
--  as watch_progress.
-- --------------------------------------------------------------------------
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  query text not null check (char_length(query) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists search_history_user_created_idx
  on public.search_history (user_id, created_at desc);

alter table public.search_history enable row level security;

drop policy if exists "search_history_select_own" on public.search_history;
create policy "search_history_select_own" on public.search_history
  for select using (auth.uid() = user_id);

drop policy if exists "search_history_insert_own" on public.search_history;
create policy "search_history_insert_own" on public.search_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "search_history_delete_own" on public.search_history;
create policy "search_history_delete_own" on public.search_history
  for delete using (auth.uid() = user_id);
