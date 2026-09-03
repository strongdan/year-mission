-- Year Mission schema — migration 0013: home-screen journal + optional AI analysis

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 12000),
  ai_analysis text,
  suggested_action text,
  promoted_task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

create policy "Users can view own journal entries" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own journal entries" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own journal entries" on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own journal entries" on public.journal_entries
  for delete using (auth.uid() = user_id);
