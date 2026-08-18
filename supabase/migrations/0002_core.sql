-- Year Mission schema — migration 0002: core domain tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null check (slug in ('money','body','home','capability')),
  title text not null,
  objective text,
  current_level text not null default 'foundation',
  progress_score integer not null default 0 check (progress_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  name text not null,
  sequence integer not null,
  start_date date not null,
  end_date date not null,
  objective text,
  unique (plan_id, sequence)
);

create table public.monthly_focuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  title text not null,
  description text,
  domain_id uuid references public.domains (id) on delete set null,
  unique (user_id, year, month)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'active',
  target_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  domain_id uuid references public.domains (id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'inbox'
    check (status in ('inbox','backlog','this_week','today','in_progress','completed','dropped')),
  estimated_minutes integer check (estimated_minutes between 1 and 480),
  impact text not null default 'medium' check (impact in ('low','medium','high')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  scheduled_date date,
  due_date date,
  weekly_commitment boolean not null default false,
  weekly_win boolean not null default false,
  defer_count integer not null default 0,
  courage_task boolean not null default false,
  meta_work boolean not null default false,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_user_scheduled_idx on public.tasks (user_id, scheduled_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  event_type text not null
    check (event_type in ('created','scheduled','started','deferred','resized','decomposed','blocked','avoidance_recorded','completed','dropped','status_changed','courage_completed','meta_flagged')),
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index task_events_user_created_idx on public.task_events (user_id, created_at);
create index task_events_task_idx on public.task_events (task_id);