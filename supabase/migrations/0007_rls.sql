-- Year Mission schema — migration 0007: RLS policies.
-- Every user-owned table enforces user isolation through auth.uid().

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.domains enable row level security;
alter table public.seasons enable row level security;
alter table public.monthly_focuses enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_events enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.workouts enable row level security;
alter table public.financial_snapshots enable row level security;
alter table public.house_progress enable row level security;
alter table public.weekly_modes enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.milestones enable row level security;
alter table public.momentum_history enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_proposals enable row level security;
alter table public.ai_cost_log enable row level security;
alter table public.experiments enable row level security;
alter table public.promises enable row level security;
alter table public.friction_events enable row level security;
alter table public.ideas enable row level security;
alter table public.stopped_items enable row level security;
alter table public.decisions enable row level security;
alter table public.evidence enable row level security;
alter table public.competencies enable row level security;
alter table public.capability_evidence enable row level security;
alter table public.google_connections enable row level security;
alter table public.google_task_sync enable row level security;

-- Helper: user-isolation policy. Enforced for the authed user only.
create or replace function public.enforce_user_isolation()
returns trigger
language plpgsql
as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'plans','domains','monthly_focuses','projects','tasks','task_events',
    'daily_checkins','workouts','financial_snapshots','house_progress','weekly_modes',
    'weekly_reviews','milestones','momentum_history','ai_conversations','ai_proposals',
    'ai_cost_log','experiments','promises','friction_events','ideas','stopped_items',
    'decisions','evidence','competencies','capability_evidence','google_connections'
  ]
  loop
    execute format('drop policy if exists "user_isolation_select" on public.%I', t);
    execute format('drop policy if exists "user_isolation_insert" on public.%I', t);
    execute format('drop policy if exists "user_isolation_update" on public.%I', t);
    execute format('drop policy if exists "user_isolation_delete" on public.%I', t);

    execute format('create policy "user_isolation_select" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "user_isolation_insert" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "user_isolation_update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "user_isolation_delete" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end
$$;

-- profiles: identity maps to auth.users.id; select on own row
drop policy if exists "profiles_user_isolation_select" on public.profiles;
create policy "profiles_user_isolation_select" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles_user_isolation_insert" on public.profiles;
create policy "profiles_user_isolation_insert" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles_user_isolation_update" on public.profiles;
create policy "profiles_user_isolation_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ai_messages are scoped by conversation ownership
drop policy if exists "ai_messages_user_isolation_select" on public.ai_messages;
create policy "ai_messages_user_isolation_select" on public.ai_messages
  for select using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );
drop policy if exists "ai_messages_user_isolation_insert" on public.ai_messages;
create policy "ai_messages_user_isolation_insert" on public.ai_messages
  for insert with check (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );
drop policy if exists "ai_messages_user_isolation_update" on public.ai_messages;
create policy "ai_messages_user_isolation_update" on public.ai_messages
  for update using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );
drop policy if exists "ai_messages_user_isolation_delete" on public.ai_messages;
create policy "ai_messages_user_isolation_delete" on public.ai_messages
  for delete using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- seasons: scoped by plan ownership
drop policy if exists "seasons_user_isolation_select" on public.seasons;
create policy "seasons_user_isolation_select" on public.seasons
  for select using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists "seasons_user_isolation_insert" on public.seasons;
create policy "seasons_user_isolation_insert" on public.seasons
  for insert with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists "seasons_user_isolation_update" on public.seasons;
create policy "seasons_user_isolation_update" on public.seasons
  for update using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists "seasons_user_isolation_delete" on public.seasons;
create policy "seasons_user_isolation_delete" on public.seasons
  for delete using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- google_task_sync: scoped by task ownership
drop policy if exists "google_task_sync_user_isolation_select" on public.google_task_sync;
create policy "google_task_sync_user_isolation_select" on public.google_task_sync
  for select using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
drop policy if exists "google_task_sync_user_isolation_insert" on public.google_task_sync;
create policy "google_task_sync_user_isolation_insert" on public.google_task_sync
  for insert with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
drop policy if exists "google_task_sync_user_isolation_update" on public.google_task_sync;
create policy "google_task_sync_user_isolation_update" on public.google_task_sync
  for update using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
drop policy if exists "google_task_sync_user_isolation_delete" on public.google_task_sync;
create policy "google_task_sync_user_isolation_delete" on public.google_task_sync
  for delete using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- profiles trigger: prevent impersonation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();