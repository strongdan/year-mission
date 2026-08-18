-- Year Mission schema — migration 0003: health, finance, house, reviews, milestones

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  alcohol_free boolean not null default false,
  weight numeric(5,2),
  steps integer,
  water integer,
  mood integer check (mood between 1 and 5),
  energy integer check (energy between 1 and 5),
  sleep_hours numeric(3,1),
  notes text,
  unique (user_id, date)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  type text not null check (type in ('lifting','walking','running','cycling','swimming','mobility','other')),
  duration_minutes integer check (duration_minutes > 0),
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  consumer_debt numeric(12,2) not null,
  cash_reserve numeric(12,2),
  notes text,
  unique (user_id, date)
);

create table public.house_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  notes text,
  unique (user_id, date)
);

create table public.weekly_modes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  mode text not null default 'normal' check (mode in ('push','normal','maintenance','recovery')),
  note text,
  unique (user_id, week_start)
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  mode text,
  score integer check (score between 0 and 100),
  wins jsonb not null default '[]'::jsonb,
  difficulties jsonb not null default '[]'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  next_week_focus text,
  weekly_win_id uuid,
  what_went_well text,
  what_didnt_happen text,
  why_not text,
  learned_about_self text,
  overcommitted boolean,
  avoided_what text,
  uncomfortable_next text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  title text not null,
  description text,
  achieved_at date not null,
  milestone_type text not null default 'milestone'
);

create table public.momentum_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  overall_score integer not null check (overall_score between 0 and 100),
  money_score integer check (money_score between 0 and 100),
  body_score integer check (body_score between 0 and 100),
  home_score integer check (home_score between 0 and 100),
  capability_score integer check (capability_score between 0 and 100),
  unique (user_id, date)
);