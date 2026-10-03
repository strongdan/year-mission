-- The prior 0023 function mixed the user's local date with the database
-- session date. The user-supplied local calendar context is authoritative.
create or replace function public.create_anticipation_plan_task(
  p_user_id uuid,
  p_event_key text,
  p_title text,
  p_notes text,
  p_prep_date date,
  p_impact text,
  p_source_event_date date,
  p_today date
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
  v_scheduled_date date := greatest(p_prep_date, p_today);
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
  if p_user_id is null or p_source_event_date is null or p_prep_date is null or p_today is null then
    raise exception 'Invalid planning date';
  end if;

  insert into public.anticipation_plans (
    user_id, event_key, task_id, source_event_date, generated_prep_date,
    generated_title, generated_notes
  )
  values (
    p_user_id, p_event_key, null, p_source_event_date, v_scheduled_date,
    btrim(p_title), p_notes
  )
  on conflict (user_id, event_key) do nothing
  returning id into v_plan_id;

  if v_plan_id is null then
    select ap.id, ap.task_id
      into v_plan_id, v_existing_task_id
      from public.anticipation_plans ap
     where ap.user_id = p_user_id
       and ap.event_key = p_event_key
     for update;

    if v_existing_task_id is not null then
      return query select v_existing_task_id, true;
      return;
    end if;

    update public.anticipation_plans
       set source_event_date = p_source_event_date,
           generated_prep_date = v_scheduled_date,
           generated_title = btrim(p_title),
           generated_notes = p_notes
     where id = v_plan_id;
  end if;

  insert into public.tasks (
    user_id, title, notes, status, impact, priority, scheduled_date, due_date, source
  )
  values (
    p_user_id, btrim(p_title), p_notes, 'inbox', p_impact, 'medium', v_scheduled_date, null, 'anticipation'
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
