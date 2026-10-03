-- Replace the initial RPC with an explicit user-local date boundary. The
-- database clock is UTC-oriented in production; future-date validation must
-- use the same local day that the client used to validate the form.

drop function if exists public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb);

create function public.upsert_credit_score_snapshot(
  p_score integer,
  p_bureau text,
  p_score_model text,
  p_measured_at date,
  p_source text default 'manual',
  p_factors jsonb default '[]'::jsonb,
  p_local_today date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bureau text := btrim(regexp_replace(coalesce(p_bureau, ''), '\s+', ' ', 'g'));
  v_score_model text := btrim(regexp_replace(coalesce(p_score_model, ''), '\s+', ' ', 'g'));
  v_bureau_key text := lower(btrim(regexp_replace(coalesce(p_bureau, ''), '\s+', ' ', 'g')));
  v_score_model_key text := lower(btrim(regexp_replace(coalesce(p_score_model, ''), '\s+', ' ', 'g')));
  v_snapshot_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_score is null or p_score < 300 or p_score > 850 then
    raise exception 'Score must be between 300 and 850' using errcode = '22023';
  end if;
  if char_length(v_bureau) not between 2 and 80 or char_length(v_score_model) not between 2 and 120 then
    raise exception 'Bureau and score model are invalid' using errcode = '22023';
  end if;
  if p_measured_at is null or p_local_today is null or p_measured_at > p_local_today then
    raise exception 'Measurement date cannot be in the future' using errcode = '22023';
  end if;
  if p_source is null or p_source not in ('manual', 'api') then
    raise exception 'Score source is invalid' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    concat_ws('|', v_user_id::text, v_bureau_key, v_score_model_key, p_measured_at::text, p_source),
    0
  ));

  select id
  into v_snapshot_id
  from public.credit_score_snapshots
  where user_id = v_user_id
    and bureau_key = v_bureau_key
    and score_model_key = v_score_model_key
    and measured_at = p_measured_at
    and source = p_source
  order by created_at desc, id desc
  limit 1
  for update;

  if v_snapshot_id is not null then
    update public.credit_score_snapshots
    set score = p_score,
        bureau = v_bureau,
        score_model = v_score_model,
        bureau_key = v_bureau_key,
        score_model_key = v_score_model_key,
        factors = coalesce(p_factors, '[]'::jsonb)
    where id = v_snapshot_id;
    return v_snapshot_id;
  end if;

  insert into public.credit_score_snapshots (
    user_id, score, bureau, bureau_key, score_model, score_model_key,
    measured_at, source, factors
  ) values (
    v_user_id, p_score, v_bureau, v_bureau_key, v_score_model, v_score_model_key,
    p_measured_at, p_source, coalesce(p_factors, '[]'::jsonb)
  )
  returning id into v_snapshot_id;

  return v_snapshot_id;
end;
$$;

revoke all on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb, date) from public;
revoke all on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb, date) from anon;
grant execute on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb, date) to authenticated;
