-- Year Mission schema — migration 0023: atomically reserve a Coming Up event and create its task
--
-- This prevents rapid taps/retries from creating duplicate preparation tasks.
-- The function runs as the caller; execution is limited to the service role.

alter table public.anticipation_plans
  add column if not exists source_event_date date,
  add column if not exists generated_prep_date date,
  add column if not exists generated_title text,
  add column if not exists generated_notes text;

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
  v_scheduled_date date := greatest(p_prep_date, p_today, current_date);
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
    -- A prior generated task may have been deleted (FK sets task_id null).
    -- The row lock also waits out a concurrent creator, so a null here is
    -- an orphaned reservation that this transaction can safely reuse.
    update public.anticipation_plans
       set source_event_date = p_source_event_date,
           generated_prep_date = v_scheduled_date,
           generated_title = btrim(p_title),
           generated_notes = p_notes
     where id = v_plan_id;
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
    v_scheduled_date,
    null,
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

create or replace function public.reconcile_anticipation_plan_task(
  p_user_id uuid,
  p_event_key text,
  p_source_event_date date,
  p_prep_date date,
  p_title text,
  p_notes text
)
returns table(task_id uuid, updated boolean, preserved boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plan public.anticipation_plans%rowtype;
  v_task public.tasks%rowtype;
  v_can_update boolean;
begin
  select * into v_plan
    from public.anticipation_plans
   where user_id = p_user_id and event_key = p_event_key
   for update;

  if not found or v_plan.task_id is null then
    return;
  end if;

  select * into v_task
    from public.tasks
   where id = v_plan.task_id and user_id = p_user_id
   for update;

  if not found then
    return;
  end if;

  if v_task.status in ('completed', 'dropped') then
    update public.anticipation_plans
       set source_event_date = p_source_event_date,
           generated_prep_date = p_prep_date,
           generated_title = btrim(p_title),
           generated_notes = p_notes
     where id = v_plan.id;
    return query select v_task.id, false, true;
    return;
  end if;

  v_can_update := v_plan.generated_title is not null
    and v_plan.generated_prep_date is not null
    and v_task.title = v_plan.generated_title
    and coalesce(v_task.notes, '') = coalesce(v_plan.generated_notes, '')
    and v_task.scheduled_date = v_plan.generated_prep_date;

  if not v_can_update then
    -- The user changed the generated task. Record the source's new position,
    -- but keep the task and its user-authored fields intact.
    update public.anticipation_plans
       set source_event_date = p_source_event_date,
           generated_prep_date = p_prep_date,
           generated_title = btrim(p_title),
           generated_notes = p_notes
     where id = v_plan.id;
    return query select v_task.id, false, true;
    return;
  end if;

  update public.tasks
     set title = btrim(p_title),
         notes = p_notes,
         scheduled_date = p_prep_date
   where id = v_task.id;

  update public.anticipation_plans
     set source_event_date = p_source_event_date,
         generated_prep_date = p_prep_date,
         generated_title = btrim(p_title),
         generated_notes = p_notes
   where id = v_plan.id;

  return query select v_task.id, true, false;
end;
$$;

revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text, date, date) from public;
revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text, date, date) from anon;
revoke all on function public.create_anticipation_plan_task(uuid, text, text, text, date, text, date, date) from authenticated;
grant execute on function public.create_anticipation_plan_task(uuid, text, text, text, date, text, date, date) to service_role;

revoke all on function public.reconcile_anticipation_plan_task(uuid, text, date, date, text, text) from public;
revoke all on function public.reconcile_anticipation_plan_task(uuid, text, date, date, text, text) from anon;
revoke all on function public.reconcile_anticipation_plan_task(uuid, text, date, date, text, text) from authenticated;
grant execute on function public.reconcile_anticipation_plan_task(uuid, text, date, date, text, text) to service_role;
