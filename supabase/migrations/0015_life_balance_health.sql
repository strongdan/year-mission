-- Year Mission schema — migration 0015: life balance + Apple Health summaries

create table public.health_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  steps integer,
  active_energy_kcal numeric(8,2),
  exercise_minutes integer,
  stand_hours integer,
  hrv_sdnn_ms numeric(8,2),
  resting_heart_rate_bpm numeric(6,2),
  sleep_minutes integer,
  source text not null default 'apple_health',
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, source)
);

alter table public.health_daily_summaries enable row level security;

create policy "health summaries are user owned"
  on public.health_daily_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index health_daily_summaries_user_date_idx
  on public.health_daily_summaries (user_id, date desc);
