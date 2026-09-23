create table if not exists public.important_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null check (kind in ('birthday','anniversary','deadline','holiday','travel','other')),
  event_date date not null,
  recurrence text not null default 'none' check (recurrence in ('none','yearly')),
  lead_days integer not null default 14 check (lead_days between 0 and 120),
  person_name text,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists important_dates_user_date_idx
  on public.important_dates(user_id, event_date);

alter table public.important_dates enable row level security;

create policy "important_dates_select_own" on public.important_dates
  for select using (auth.uid() = user_id);
create policy "important_dates_insert_own" on public.important_dates
  for insert with check (auth.uid() = user_id);
create policy "important_dates_update_own" on public.important_dates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "important_dates_delete_own" on public.important_dates
  for delete using (auth.uid() = user_id);

create table if not exists public.anticipation_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, event_key)
);

create index if not exists anticipation_plans_user_idx
  on public.anticipation_plans(user_id, created_at desc);

alter table public.anticipation_plans enable row level security;

create policy "anticipation_plans_select_own" on public.anticipation_plans
  for select using (auth.uid() = user_id);
create policy "anticipation_plans_insert_own" on public.anticipation_plans
  for insert with check (auth.uid() = user_id);
create policy "anticipation_plans_update_own" on public.anticipation_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "anticipation_plans_delete_own" on public.anticipation_plans
  for delete using (auth.uid() = user_id);
