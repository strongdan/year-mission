-- Year Mission schema — migration 0022: atomic partial Apple Health merge

create or replace function public.upsert_health_daily_summary(
  p_user_id uuid,
  p_date date,
  p_source text,
  p_values jsonb,
  p_observed_at timestamptz default null
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.health_daily_summaries (
    user_id, date, source, steps, active_energy_kcal, exercise_minutes,
    stand_hours, hrv_sdnn_ms, resting_heart_rate_bpm, sleep_minutes,
    observed_at, updated_at
  )
  values (
    p_user_id,
    p_date,
    coalesce(nullif(p_source, ''), 'apple_health'),
    (p_values ->> 'steps')::integer,
    (p_values ->> 'active_energy_kcal')::numeric,
    (p_values ->> 'exercise_minutes')::integer,
    (p_values ->> 'stand_hours')::integer,
    (p_values ->> 'hrv_sdnn_ms')::numeric,
    (p_values ->> 'resting_heart_rate_bpm')::numeric,
    (p_values ->> 'sleep_minutes')::integer,
    coalesce(p_observed_at, now()),
    now()
  )
  on conflict (user_id, date, source) do update set
    steps = coalesce(excluded.steps, health_daily_summaries.steps),
    active_energy_kcal = coalesce(excluded.active_energy_kcal, health_daily_summaries.active_energy_kcal),
    exercise_minutes = coalesce(excluded.exercise_minutes, health_daily_summaries.exercise_minutes),
    stand_hours = coalesce(excluded.stand_hours, health_daily_summaries.stand_hours),
    hrv_sdnn_ms = coalesce(excluded.hrv_sdnn_ms, health_daily_summaries.hrv_sdnn_ms),
    resting_heart_rate_bpm = coalesce(excluded.resting_heart_rate_bpm, health_daily_summaries.resting_heart_rate_bpm),
    sleep_minutes = coalesce(excluded.sleep_minutes, health_daily_summaries.sleep_minutes),
    observed_at = coalesce(excluded.observed_at, health_daily_summaries.observed_at),
    updated_at = now();
$$;

revoke execute on function public.upsert_health_daily_summary(uuid, date, text, jsonb, timestamptz) from public;
grant execute on function public.upsert_health_daily_summary(uuid, date, text, jsonb, timestamptz) to service_role;
