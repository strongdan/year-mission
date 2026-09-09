-- Year Mission schema — migration 0020: movement variety nudges
--
-- This is deliberately not a streak/habit table. It records enough recent activity
-- to help the app notice when movement has gone quiet and to suggest a different,
-- appealing option without turning missed days into failure.

create table public.movement_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  nudge_after_days integer not null default 2 check (nudge_after_days between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger movement_preferences_set_updated_at
  before update on public.movement_preferences
  for each row execute function public.set_updated_at();

create table public.movement_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity text not null check (activity in ('swim','run','skate','hike','walk','bike','other')),
  happened_on date not null,
  source text not null default 'manual' check (source in ('manual','imported')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, activity, happened_on)
);

create index movement_activity_log_user_date_idx
  on public.movement_activity_log (user_id, happened_on desc);

alter table public.movement_preferences enable row level security;
alter table public.movement_activity_log enable row level security;

create policy "Users can view own movement preferences" on public.movement_preferences
  for select using (auth.uid() = user_id);
create policy "Users can insert own movement preferences" on public.movement_preferences
  for insert with check (auth.uid() = user_id);
create policy "Users can update own movement preferences" on public.movement_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own movement preferences" on public.movement_preferences
  for delete using (auth.uid() = user_id);

create policy "Users can view own movement activity" on public.movement_activity_log
  for select using (auth.uid() = user_id);
create policy "Users can insert own movement activity" on public.movement_activity_log
  for insert with check (auth.uid() = user_id);
create policy "Users can update own movement activity" on public.movement_activity_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own movement activity" on public.movement_activity_log
  for delete using (auth.uid() = user_id);
