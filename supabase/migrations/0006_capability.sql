-- Year Mission schema — migration 0006: capability/competency + integrations

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null check (category in ('engineering','professional')),
  level text not null default 'exposure'
    check (level in ('exposure','functional','independent','strong','can_teach')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger competencies_set_updated_at
  before update on public.competencies
  for each row execute function public.set_updated_at();

create table public.capability_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  competency_id uuid references public.competencies (id) on delete set null,
  date date not null default current_date,
  type text not null
    check (type in ('shipped_feature','debugged_production','designed_architecture','wrote_migration','interview_passed','open_source','explained_topic','taught_other','deployment','technical_learning','certification','professional_relationship','difficult_problem','portfolio','interview')),
  title text not null,
  description text,
  url text,
  confidence integer check (confidence between 1 and 5),
  is_strong_evidence boolean not null default true
);

create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  google_user_id text,
  email text,
  refresh_token text,
  token_encrypted boolean not null default false,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger google_connections_set_updated_at
  before update on public.google_connections
  for each row execute function public.set_updated_at();

create table public.google_task_sync (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  google_task_id text,
  google_tasklist_id text,
  local_updated_at timestamptz,
  google_updated_at timestamptz,
  sync_status text not null default 'pending'
    check (sync_status in ('pending','synced','conflict','error')),
  last_synced_at timestamptz,
  unique (task_id)
);