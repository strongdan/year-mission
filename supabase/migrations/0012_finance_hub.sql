-- Year Mission schema — migration 0012: normalized finance hub

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('actual','simplefin','manual','import')),
  provider_account_id text not null,
  name text not null,
  institution_name text,
  account_type text not null default 'other' check (account_type in ('checking','savings','credit','loan','investment','cash','other')),
  balance numeric(14,2),
  available_balance numeric(14,2),
  currency text not null default 'USD',
  active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_account_id)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  finance_account_id uuid not null references public.finance_accounts (id) on delete cascade,
  provider text not null check (provider in ('actual','simplefin','manual','import')),
  provider_transaction_id text not null,
  posted_date date not null,
  amount numeric(14,2) not null,
  payee text,
  category text,
  pending boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_transaction_id)
);

create table public.finance_liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  finance_account_id uuid references public.finance_accounts (id) on delete set null,
  provider text not null check (provider in ('actual','simplefin','manual','import')),
  provider_liability_id text not null,
  name text not null,
  liability_type text not null default 'other' check (liability_type in ('credit_card','student_loan','mortgage','auto','personal','other')),
  balance numeric(14,2) not null,
  apr numeric(7,4),
  minimum_payment numeric(14,2),
  due_date date,
  accrued_interest numeric(14,2),
  currency text not null default 'USD',
  source_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_liability_id)
);

create index finance_accounts_user_active_idx on public.finance_accounts (user_id, active);
create index finance_transactions_user_date_idx on public.finance_transactions (user_id, posted_date desc);
create index finance_transactions_account_date_idx on public.finance_transactions (finance_account_id, posted_date desc);
create index finance_liabilities_user_idx on public.finance_liabilities (user_id, liability_type);

alter table public.finance_accounts enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_liabilities enable row level security;

create policy "Users can view own finance accounts" on public.finance_accounts
  for select using (auth.uid() = user_id);
create policy "Users can insert own finance accounts" on public.finance_accounts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own finance accounts" on public.finance_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own finance accounts" on public.finance_accounts
  for delete using (auth.uid() = user_id);

create policy "Users can view own finance transactions" on public.finance_transactions
  for select using (auth.uid() = user_id);
create policy "Users can insert own finance transactions" on public.finance_transactions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own finance transactions" on public.finance_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own finance transactions" on public.finance_transactions
  for delete using (auth.uid() = user_id);

create policy "Users can view own finance liabilities" on public.finance_liabilities
  for select using (auth.uid() = user_id);
create policy "Users can insert own finance liabilities" on public.finance_liabilities
  for insert with check (auth.uid() = user_id);
create policy "Users can update own finance liabilities" on public.finance_liabilities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own finance liabilities" on public.finance_liabilities
  for delete using (auth.uid() = user_id);
