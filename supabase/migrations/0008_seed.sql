-- Year Mission schema — migration 0008: seed.
-- Seeds the canonical four domains for every user on bootstrap via an RPC,
-- plus static season definitions used to build a user's plan.

create or replace function public.bootstrap_user()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan_id uuid;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.domains (user_id, slug, title, objective)
  values
    (v_user, 'money', 'Money', 'Reduce and eliminate consumer debt.'),
    (v_user, 'body', 'Body', 'Stop drinking, lose 20+ lb, build strength and cardiovascular fitness.'),
    (v_user, 'home', 'Home', 'Prepare the house for sale.'),
    (v_user, 'capability', 'Capability', 'Increase self-knowledge, confidence, technical competence, and career resilience.')
  on conflict (user_id, slug) do nothing;

  insert into public.plans (user_id, title, start_date, end_date, status)
  values (v_user, 'Year One', '2026-08-01', '2027-08-01', 'active')
  on conflict do nothing
  returning id into v_plan_id;

  if v_plan_id is not null then
    insert into public.seasons (plan_id, name, sequence, start_date, end_date, objective)
    values
      (v_plan_id, 'Stabilize', 1, '2026-08-01', '2026-10-31', 'Establish the baseline: no alcohol, consistent movement, controlled environment, initial money plan.'),
      (v_plan_id, 'Build', 2, '2026-11-01', '2027-01-31', 'Build strength, clear the house, and grow technical competence.'),
      (v_plan_id, 'Transform', 3, '2027-02-01', '2027-04-30', 'Transform nutrition, cardio, and tackle the major house projects.'),
      (v_plan_id, 'Convert', 4, '2027-05-01', '2027-07-31', 'Convert progress into professional independence, a finished house, and financial sprint.')
    on conflict do nothing;
  end if;

  insert into public.monthly_focuses (user_id, month, year, title)
  values
    (v_user, 8, 2026, 'Baseline'),
    (v_user, 9, 2026, 'Alcohol + Environment'),
    (v_user, 10, 2026, 'Money'),
    (v_user, 11, 2026, 'Strength'),
    (v_user, 12, 2026, 'House / Decluttering'),
    (v_user, 1, 2027, 'Technical Competence'),
    (v_user, 2, 2027, 'Nutrition'),
    (v_user, 3, 2027, 'Cardio'),
    (v_user, 4, 2027, 'House Projects'),
    (v_user, 5, 2027, 'Professional Independence'),
    (v_user, 6, 2027, 'House Finish'),
    (v_user, 7, 2027, 'Financial Sprint')
  on conflict (user_id, year, month) do nothing;
end;
$$;