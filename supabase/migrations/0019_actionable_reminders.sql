-- Year Mission schema — migration 0019: actionable reminders.
-- A reminder should trigger a concrete first step, not merely awareness.

create table if not exists public.actionable_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  launch_step text not null check (char_length(launch_step) between 1 and 500),
  launch_url text,
  next_due_date date not null,
  recurrence_days integer check (recurrence_days is null or recurrence_days between 1 and 3650),
  default_reschedule_days integer not null default 7 check (default_reschedule_days between 1 and 365),
  active boolean not null default true,
  last_launched_at timestamptz,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists actionable_reminders_user_due_idx
  on public.actionable_reminders (user_id, active, next_due_date);

alter table public.actionable_reminders enable row level security;

create policy "actionable reminders are owner readable"
  on public.actionable_reminders for select
  using (auth.uid() = user_id);

create policy "actionable reminders are owner insertable"
  on public.actionable_reminders for insert
  with check (auth.uid() = user_id);

create policy "actionable reminders are owner updatable"
  on public.actionable_reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "actionable reminders are owner deletable"
  on public.actionable_reminders for delete
  using (auth.uid() = user_id);
