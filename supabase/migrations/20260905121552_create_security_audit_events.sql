create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  actor_user_id uuid null references auth.users(id) on delete set null,
  target_user_id uuid null references auth.users(id) on delete set null,
  ip_address inet null,
  user_agent text null,
  request_id text null,
  metadata jsonb not null default '{}'::jsonb,
  constraint security_audit_events_event_type_check check (length(trim(event_type)) between 1 and 120)
);

create index if not exists security_audit_events_created_at_idx
  on public.security_audit_events (created_at desc);
create index if not exists security_audit_events_actor_user_id_idx
  on public.security_audit_events (actor_user_id, created_at desc);
create index if not exists security_audit_events_target_user_id_idx
  on public.security_audit_events (target_user_id, created_at desc);
create index if not exists security_audit_events_event_type_idx
  on public.security_audit_events (event_type, created_at desc);

alter table public.security_audit_events enable row level security;

revoke all on table public.security_audit_events from anon, authenticated;
grant select, insert, update, delete on table public.security_audit_events to service_role;
