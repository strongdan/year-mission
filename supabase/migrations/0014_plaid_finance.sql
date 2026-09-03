-- Year Mission schema — migration 0014: Plaid read-only finance connection support

alter table public.finance_accounts drop constraint if exists finance_accounts_provider_check;
alter table public.finance_accounts add constraint finance_accounts_provider_check
  check (provider in ('actual','simplefin','plaid','manual','import'));

alter table public.finance_transactions drop constraint if exists finance_transactions_provider_check;
alter table public.finance_transactions add constraint finance_transactions_provider_check
  check (provider in ('actual','simplefin','plaid','manual','import'));

alter table public.finance_liabilities drop constraint if exists finance_liabilities_provider_check;
alter table public.finance_liabilities add constraint finance_liabilities_provider_check
  check (provider in ('actual','simplefin','plaid','manual','import'));

create table public.finance_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('plaid')),
  provider_connection_id text not null,
  credential_ciphertext text not null,
  display_name text,
  status text not null default 'active' check (status in ('active','reconnect_required','disconnected','error')),
  sync_cursor text,
  consent_expires_at timestamptz,
  last_error_code text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_connection_id)
);

create index finance_connections_user_provider_idx
  on public.finance_connections (user_id, provider, status);

create trigger finance_connections_set_updated_at
  before update on public.finance_connections
  for each row execute function public.set_updated_at();

alter table public.finance_connections enable row level security;

-- Deliberately define no SELECT/INSERT/UPDATE policy. Permanent Plaid access tokens,
-- including their encrypted ciphertext, are only handled by authenticated server
-- actions through the service-role client after explicitly scoping user_id.
-- Users may delete their own connection row if a future direct client flow needs it.
create policy "Users can delete own finance connections" on public.finance_connections
  for delete using (auth.uid() = user_id);
