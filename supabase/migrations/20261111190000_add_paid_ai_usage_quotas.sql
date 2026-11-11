-- Monthly-cycle AI usage reservations for paid SHABDIZ features.
-- The quota follows the Stripe subscription billing period, not calendar months.

create table if not exists public.ai_usage_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  quota integer not null check (quota >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subscription_id, period_start),
  check (period_end > period_start)
);

create table if not exists public.ai_usage_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id uuid not null references public.ai_usage_periods(id) on delete cascade,
  feature text not null check (feature in ('horse-passport', 'training-coach')),
  status text not null default 'reserved' check (status in ('reserved', 'consumed', 'released')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index if not exists ai_usage_periods_user_period_idx
  on public.ai_usage_periods (user_id, period_start desc);
create index if not exists ai_usage_requests_user_created_idx
  on public.ai_usage_requests (user_id, created_at desc);
create index if not exists ai_usage_requests_period_status_idx
  on public.ai_usage_requests (period_id, status);

alter table public.ai_usage_periods enable row level security;
alter table public.ai_usage_requests enable row level security;

revoke all on public.ai_usage_periods from public, anon, authenticated;
revoke all on public.ai_usage_requests from public, anon, authenticated;

create or replace function public.reserve_ai_usage(
  p_request_id uuid,
  p_feature text
)
returns table (
  allowed boolean,
  reason text,
  used integer,
  quota integer,
  remaining integer,
  period_end timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription record;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_quota integer;
  v_period_id uuid;
  v_used integer;
  v_reserved integer;
  v_existing public.ai_usage_requests%rowtype;
begin
  if v_user_id is null then
    return query select false, 'unauthenticated', 0, 0, 0, null::timestamptz;
    return;
  end if;

  if p_feature not in ('horse-passport', 'training-coach') then
    return query select false, 'invalid_feature', 0, 0, 0, null::timestamptz;
    return;
  end if;

  select s.id, s.status, s.current_period_start, s.current_period_end, p.slug, p.active
    into v_subscription
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
   where s.user_id = v_user_id
   limit 1;

  if not found or v_subscription.status <> 'active' or v_subscription.active is distinct from true
     or v_subscription.slug not in ('pro', 'enterprise') then
    return query select false, 'subscription_required', 0, 0, 0, null::timestamptz;
    return;
  end if;

  v_quota := case v_subscription.slug
    when 'pro' then 15
    when 'enterprise' then 50
    else 0
  end;

  v_period_start := coalesce(v_subscription.current_period_start, date_trunc('month', now()));
  v_period_end := coalesce(v_subscription.current_period_end, v_period_start + interval '1 month');

  if v_period_end <= now() then
    return query select false, 'subscription_period_expired', 0, v_quota, 0, v_period_end;
    return;
  end if;

  insert into public.ai_usage_periods (
    user_id, subscription_id, period_start, period_end, quota
  )
  values (
    v_user_id, v_subscription.id, v_period_start, v_period_end, v_quota
  )
  on conflict (user_id, subscription_id, period_start)
  do update set period_end = excluded.period_end, quota = excluded.quota, updated_at = now()
  returning id, used_count, reserved_count
    into v_period_id, v_used, v_reserved;

  -- Serialize reservations for this user's billing period.
  select used_count, reserved_count
    into v_used, v_reserved
    from public.ai_usage_periods
   where id = v_period_id
   for update;

  -- Recover reservations left behind by crashed/timed-out server requests.
  update public.ai_usage_requests
     set status = 'released', finalized_at = now()
   where period_id = v_period_id
     and status = 'reserved'
     and created_at < now() - interval '10 minutes';

  update public.ai_usage_periods
     set reserved_count = (
       select count(*)::integer
         from public.ai_usage_requests
        where period_id = v_period_id and status = 'reserved'
     ),
     updated_at = now()
   where id = v_period_id;

  select used_count, reserved_count
    into v_used, v_reserved
    from public.ai_usage_periods
   where id = v_period_id;

  select *
    into v_existing
    from public.ai_usage_requests
   where id = p_request_id;

  if found then
    if v_existing.user_id = v_user_id and v_existing.status in ('reserved', 'consumed') then
      return query select true, 'already_reserved', v_used, v_quota,
        greatest(v_quota - v_used - v_reserved, 0), v_period_end;
    end if;
    return query select false, 'duplicate_request', v_used, v_quota,
      greatest(v_quota - v_used - v_reserved, 0), v_period_end;
    return;
  end if;

  if v_used + v_reserved >= v_quota then
    return query select false, 'quota_exceeded', v_used, v_quota, 0, v_period_end;
    return;
  end if;

  insert into public.ai_usage_requests (id, user_id, period_id, feature)
  values (p_request_id, v_user_id, v_period_id, p_feature);

  update public.ai_usage_periods
     set reserved_count = reserved_count + 1, updated_at = now()
   where id = v_period_id;

  return query select true, 'reserved', v_used, v_quota,
    greatest(v_quota - v_used - v_reserved - 1, 0), v_period_end;
end;
$$;

create or replace function public.finalize_ai_usage(
  p_request_id uuid,
  p_success boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.ai_usage_requests%rowtype;
begin
  if v_user_id is null then
    return false;
  end if;

  select *
    into v_request
    from public.ai_usage_requests
   where id = p_request_id
     and user_id = v_user_id
   for update;

  if not found or v_request.status <> 'reserved' then
    return false;
  end if;

  if p_success then
    update public.ai_usage_periods
       set reserved_count = greatest(reserved_count - 1, 0),
           used_count = used_count + 1,
           updated_at = now()
     where id = v_request.period_id;
    update public.ai_usage_requests
       set status = 'consumed', finalized_at = now()
     where id = p_request_id;
  else
    update public.ai_usage_periods
       set reserved_count = greatest(reserved_count - 1, 0),
           updated_at = now()
     where id = v_request.period_id;
    update public.ai_usage_requests
       set status = 'released', finalized_at = now()
     where id = p_request_id;
  end if;

  return true;
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, text) from public, anon;
revoke all on function public.finalize_ai_usage(uuid, boolean) from public, anon;
grant execute on function public.reserve_ai_usage(uuid, text) to authenticated;
grant execute on function public.finalize_ai_usage(uuid, boolean) to authenticated;

comment on table public.ai_usage_periods is
  'Server-managed monthly AI quota counters, scoped to a paid subscription billing period.';
comment on table public.ai_usage_requests is
  'Server-managed AI usage reservations; failed AI calls release their reservation.';
