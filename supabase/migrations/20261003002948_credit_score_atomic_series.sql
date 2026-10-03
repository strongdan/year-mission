-- Year Mission schema — forward-only migration: atomic manual credit-score corrections.
--
-- Existing rows are deliberately preserved. The non-unique canonical index lets
-- us address historical casing/whitespace variants without deleting or merging
-- user history. The RPC serializes same-day corrections at the database boundary
-- and updates the newest matching historical row when one already exists.

alter table public.credit_score_snapshots
  add column if not exists bureau_key text,
  add column if not exists score_model_key text;

update public.credit_score_snapshots
set
  bureau_key = lower(regexp_replace(btrim(bureau), '\s+', ' ', 'g')),
  score_model_key = lower(regexp_replace(btrim(score_model), '\s+', ' ', 'g'))
where bureau_key is null or score_model_key is null;

alter table public.credit_score_snapshots
  alter column bureau_key set not null,
  alter column score_model_key set not null;

create index if not exists credit_score_snapshots_canonical_series_idx
  on public.credit_score_snapshots (user_id, bureau_key, score_model_key, measured_at, source, created_at desc);

create or replace function public.upsert_credit_score_snapshot(
  p_score integer,
  p_bureau text,
  p_score_model text,
  p_measured_at date,
  p_source text default 'manual',
  p_factors jsonb default '[]'::jsonb
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
  if p_measured_at is null or p_measured_at > current_date then
    raise exception 'Measurement date cannot be in the future' using errcode = '22023';
  end if;
  if p_source is null or p_source not in ('manual', 'api') then
    raise exception 'Score source is invalid' using errcode = '22023';
  end if;

  -- Serialize only the logical record being corrected. This prevents two
  -- retries/tabs from both observing no row and inserting duplicates.
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

revoke all on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb) from public;
revoke all on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb) from anon;
grant execute on function public.upsert_credit_score_snapshot(integer, text, text, date, text, jsonb) to authenticated;
