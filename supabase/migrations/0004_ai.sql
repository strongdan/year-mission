-- Year Mission schema — migration 0004: AI tables

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Coach',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(8,4),
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  action_type text not null,
  payload jsonb not null,
  reasoning text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index ai_proposals_user_pending_idx on public.ai_proposals (user_id, status) where status = 'pending';

create table public.ai_cost_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric(8,4) not null default 0,
  purpose text,
  created_at timestamptz not null default now()
);

create index ai_cost_log_user_created_idx on public.ai_cost_log (user_id, created_at);