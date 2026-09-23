-- Year Mission schema — migration 0018: review tools / decision log.

create table if not exists public.decision_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (char_length(decision) between 1 and 500),
  context text,
  reasoning text,
  confidence integer check (confidence between 0 and 100),
  decided_at date not null default current_date,
  review_date date,
  actual_outcome text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decision_log_user_decided_idx
  on public.decision_log(user_id, decided_at desc);

alter table public.decision_log enable row level security;

drop policy if exists decision_log_owner_select on public.decision_log;
create policy decision_log_owner_select on public.decision_log
  for select using (auth.uid() = user_id);

drop policy if exists decision_log_owner_insert on public.decision_log;
create policy decision_log_owner_insert on public.decision_log
  for insert with check (auth.uid() = user_id);

drop policy if exists decision_log_owner_update on public.decision_log;
create policy decision_log_owner_update on public.decision_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists decision_log_owner_delete on public.decision_log;
create policy decision_log_owner_delete on public.decision_log
  for delete using (auth.uid() = user_id);
