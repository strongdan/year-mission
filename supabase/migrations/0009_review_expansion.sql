-- Year Mission schema — migration 0009: weekly review expansion.
-- Covers the full SPEC §23 question set.

alter table public.weekly_reviews
  add column if not exists stop_doing jsonb not null default '[]'::jsonb,
  add column if not exists next_weekly_win text,
  add column if not exists most_important_actions jsonb not null default '{}'::jsonb;