create table if not exists public.lab_panels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collected_at timestamptz,
  source_name text,
  source_filename text,
  source_sha256 text,
  ai_interpretation text,
  ai_provider text,
  ai_model text,
  ai_input_tokens integer,
  ai_output_tokens integer,
  ai_estimated_cost numeric(12,6),
  ai_latency_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  panel_id uuid not null references public.lab_panels(id) on delete cascade,
  test_name text not null,
  loinc_code text,
  value_numeric numeric,
  value_text text,
  unit text,
  reference_low numeric,
  reference_high numeric,
  reference_text text,
  abnormal_flag text check (abnormal_flag in ('low','high','normal','abnormal','unknown')) default 'unknown',
  confirmed_by_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lab_panels_user_collected_idx on public.lab_panels(user_id, collected_at desc nulls last, created_at desc);
create index if not exists lab_results_user_test_idx on public.lab_results(user_id, test_name, created_at desc);
create index if not exists lab_results_panel_idx on public.lab_results(panel_id);

create trigger lab_panels_set_updated_at before update on public.lab_panels
for each row execute function public.set_updated_at();
create trigger lab_results_set_updated_at before update on public.lab_results
for each row execute function public.set_updated_at();

alter table public.lab_panels enable row level security;
alter table public.lab_results enable row level security;

create policy "lab panels owner select" on public.lab_panels for select using (auth.uid() = user_id);
create policy "lab panels owner insert" on public.lab_panels for insert with check (auth.uid() = user_id);
create policy "lab panels owner update" on public.lab_panels for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lab panels owner delete" on public.lab_panels for delete using (auth.uid() = user_id);

create policy "lab results owner select" on public.lab_results for select using (auth.uid() = user_id);
create policy "lab results owner insert" on public.lab_results for insert with check (auth.uid() = user_id);
create policy "lab results owner update" on public.lab_results for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lab results owner delete" on public.lab_results for delete using (auth.uid() = user_id);
