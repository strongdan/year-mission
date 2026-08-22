-- Year Mission schema — migration 0010: add evening reset tracking to daily_checkins

alter table public.daily_checkins
  add column evening_reset_completion text check (evening_reset_completion in ('target', 'floor', 'skipped')),
  add column evening_reset_variant text;
