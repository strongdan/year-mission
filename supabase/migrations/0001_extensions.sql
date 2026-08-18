-- Year Mission schema — migration 0001: extensions + helpers
create extension if not exists "pgcrypto";

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.uid()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;