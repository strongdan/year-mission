-- Year Mission schema — migration 0011: PWA check-in notifications

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default false,
  morning_enabled boolean not null default true,
  morning_time time not null default '08:00',
  evening_enabled boolean not null default true,
  evening_time time not null default '20:30',
  timezone text not null default 'UTC',
  last_morning_sent_on date,
  last_evening_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  expiration_time bigint,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
