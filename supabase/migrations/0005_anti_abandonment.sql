-- Year Mission schema — migration 0005: anti-abandonment tables

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  hypothesis text,
  start_date date not null,
  planned_end_date date,
  status text not null default 'planned'
    check (status in ('planned','active','completed','abandoned')),
  target_metric text,
  baseline_value numeric(8,2),
  result_value numeric(8,2),
  conclusion text,
  decision text check (decision in ('keep','modify','abandon')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.promises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  title text not null,
  committed_for timestamptz not null,
  status text not null default 'active'
    check (status in ('active','kept','renegotiated','missed','cancelled')),
  resolution_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index promises_user_status_idx on public.promises (user_id, status);

create table public.friction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  reason text not null
    check (reason in ('forgot','too_tired','did_not_feel_like_it','too_big','got_distracted','competing_priority','did_not_know_how','blocked','not_important','just_avoiding','other')),
  note text,
  created_at timestamptz not null default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'parked' check (status in ('parked','active','deleted')),
  created_at timestamptz not null default now(),
  last_reviewed_at timestamptz
);

create table public.stopped_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  type text not null,
  reason text,
  stopped_at date not null default current_date
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  context text,
  decision text not null,
  reasoning text,
  confidence_pct integer check (confidence_pct between 0 and 100),
  decided_at date not null,
  review_date date,
  outcome text,
  outcome_rating integer check (outcome_rating between 1 and 5)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  type text not null
    check (type in ('sobriety','fitness','debt','home','career','reliability','courage','avoidance_overcome','milestone','personal_best')),
  title text not null,
  description text,
  source_type text,
  source_id uuid,
  occurred_at date not null default current_date,
  significance integer not null default 1 check (significance between 1 and 5),
  metadata jsonb not null default '{}'::jsonb
);

create index evidence_user_occurred_idx on public.evidence (user_id, occurred_at desc);