-- Year Mission schema — migration 0023: atomically reserve a Coming Up event and create its task
--
-- This prevents rapid taps/retries from creating duplicate preparation tasks.
-- The function runs as the caller; execution is limited to the service role.

create or replace function public.create_anticipation_plan_task(
  p_user_id uuid,
  p_event_key text,
  p_title text,
  p_notes text,
  p_prep_date date,
  p_impact text
)
returns table(task_id uuid, already_planned boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_task_id uuid;
  v_existing_task_id uuid;
begin
  if p_event_key is null or char_length(p_event_key) < 3 or char_length(p_event_key) > 500 then
    raise exception 'Invalid event key';
  end if;
  if p_title is null or btrim(p_title) = '' or char_length(p_title) > 200 then
    raise exception 'Invalid task title';
  end if;
  if p_impact not in ('low', 'medium', 'high') then
    raise exception 'Invalid impact';
  end if;

  insert into public.anticipation_plans (user_id, event_key, task_id)
  values (p_user_id, p_event_key, null)
  on conflict (user_id, event_key) do nothing
  returning id into v_plan_id;

  if v_plan_id is null then
    select ap.task_id
      into v_existing_task_id
      from public.anticipation_plans ap
     where ap.user_id = p_user_id
       and ap.event_key = p_event_key;

    if v_existing_task_id is null then
      raise exception 'Planning request is already in progress';
    end if;

    return query select v_existing_task_id, true;
    return;
  end if;

  insert into public.tasks (
    user_id,
    title,
    notes,
    status,
    impact,
    priority,
    scheduled_date,
    due_date,
    source
  )
  values (
    p_user_id,
    btrim(p_title),
    p_notes,
    'inbox',
    p_impact,
    'medium',
    p_prep_date,
    p_prep_date,
    'anticipation'
  )
  returning id into v_task_id;

  insert into public.task_events (user_id, task_id, event_type, event_data)
  values (p_user_id, v_task_id, 'created', jsonb_build_object('meta_work', false, 'source', 'anticipation'));

  update public.anticipation_plans
     set task_id = v_task_id
   where id = v_plan_id;

  return query select v_task_id, false;
end;
$$;

revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text) from public;
revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text) from anon;
revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text) from authenticated;
grant execute on function public.create_anticipation_plan_task(uuid, text, text, text, date, text) to service_role;
