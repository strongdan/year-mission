create table if not exists public.credit_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 300 and 850),
  bureau text not null check (char_length(bureau) between 2 and 80),
  score_model text not null check (char_length(score_model) between 2 and 120),
  source text not null default 'manual' check (source in ('manual','api')),
  factors jsonb not null default '[]'::jsonb,
  measured_at date not null,
  created_at timestamptz not null default now(),
  unique (user_id, bureau, score_model, measured_at, source)
);

create index if not exists credit_score_snapshots_user_measured_idx
  on public.credit_score_snapshots (user_id, measured_at desc, created_at desc);

alter table public.credit_score_snapshots enable row level security;

create policy "credit score snapshots owner select"
  on public.credit_score_snapshots for select
  using (auth.uid() = user_id);
create policy "credit score snapshots owner insert"
  on public.credit_score_snapshots for insert
  with check (auth.uid() = user_id);
create policy "credit score snapshots owner update"
  on public.credit_score_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "credit score snapshots owner delete"
  on public.credit_score_snapshots for delete
  using (auth.uid() = user_id);

create table if not exists public.credit_score_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'generic_api' check (provider = 'generic_api'),
  external_subject_id text not null check (char_length(external_subject_id) between 1 and 240),
  enabled boolean not null default false,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_score_connections enable row level security;
create policy "credit score connections owner select"
  on public.credit_score_connections for select using (auth.uid() = user_id);
create policy "credit score connections owner insert"
  on public.credit_score_connections for insert with check (auth.uid() = user_id);
create policy "credit score connections owner update"
  on public.credit_score_connections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit score connections owner delete"
  on public.credit_score_connections for delete using (auth.uid() = user_id);
