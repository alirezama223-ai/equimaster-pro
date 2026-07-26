-- EquiMaster Pro Phase 14.1: Daily Training foundation (revised)
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–019).
--
-- Creates exercises, training_plans, training_sessions, training_session_exercises.
-- No seed data. No changes to existing tables.

-- ---------------------------------------------------------------------------
-- exercises — system catalog + user-created custom exercises
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'user' check (source in ('system', 'user')),
  created_by uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  category text not null default 'other' check (
    category in (
      'warmup',
      'flatwork',
      'jumping',
      'polework',
      'conditioning',
      'cooldown',
      'groundwork',
      'other'
    )
  ),
  discipline text check (
    discipline is null
    or discipline in ('Show Jumping', 'Dressage', 'Eventing', 'Hunter', 'Other')
  ),
  difficulty text not null default 'intermediate' check (
    difficulty in ('beginner', 'intermediate', 'advanced')
  ),
  duration_minutes integer check (
    duration_minutes is null or duration_minutes > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_name_not_blank check (length(trim(name)) > 0),
  constraint exercises_source_owner_consistency check (
    (source = 'system' and created_by is null)
    or (source = 'user' and created_by is not null)
  )
);

create index if not exists exercises_source_idx
  on public.exercises (source);
create index if not exists exercises_created_by_idx
  on public.exercises (created_by)
  where created_by is not null;
create index if not exists exercises_category_idx
  on public.exercises (category);
create index if not exists exercises_discipline_idx
  on public.exercises (discipline)
  where discipline is not null;
create index if not exists exercises_created_at_idx
  on public.exercises (created_at desc);

-- ---------------------------------------------------------------------------
-- training_plans — reusable plan templates (not tied to a single horse)
-- ---------------------------------------------------------------------------
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (
    status in ('draft', 'active', 'completed', 'archived')
  ),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plans_name_not_blank check (length(trim(name)) > 0),
  constraint training_plans_date_range check (
    start_date is null
    or end_date is null
    or end_date >= start_date
  )
);

create index if not exists training_plans_created_by_idx
  on public.training_plans (created_by);
create index if not exists training_plans_status_idx
  on public.training_plans (status);
create index if not exists training_plans_created_at_idx
  on public.training_plans (created_at desc);

-- ---------------------------------------------------------------------------
-- training_sessions — daily training log for a specific managed horse
-- ---------------------------------------------------------------------------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  training_plan_id uuid references public.training_plans (id) on delete set null,
  session_date date not null default current_date,
  title text,
  notes text,
  session_goal text,
  energy_level text check (
    energy_level is null
    or energy_level in ('low', 'moderate', 'high')
  ),
  confidence text check (
    confidence is null
    or confidence in ('low', 'medium', 'high')
  ),
  status text not null default 'planned' check (
    status in ('planned', 'in_progress', 'completed', 'skipped', 'cancelled')
  ),
  duration_minutes integer check (
    duration_minutes is null or duration_minutes > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_created_by_idx
  on public.training_sessions (created_by);
create index if not exists training_sessions_pedigree_horse_id_idx
  on public.training_sessions (pedigree_horse_id);
create index if not exists training_sessions_training_plan_id_idx
  on public.training_sessions (training_plan_id)
  where training_plan_id is not null;
create index if not exists training_sessions_session_date_idx
  on public.training_sessions (session_date desc);
create index if not exists training_sessions_horse_date_idx
  on public.training_sessions (pedigree_horse_id, session_date desc);

-- ---------------------------------------------------------------------------
-- training_session_exercises — ordered exercises within a session
-- ---------------------------------------------------------------------------
create table if not exists public.training_session_exercises (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  duration_minutes integer check (
    duration_minutes is null or duration_minutes > 0
  ),
  notes text,
  created_at timestamptz not null default now(),
  constraint training_session_exercises_unique_order
    unique (training_session_id, sort_order),
  constraint training_session_exercises_unique_exercise
    unique (training_session_id, exercise_id)
);

create index if not exists training_session_exercises_session_idx
  on public.training_session_exercises (training_session_id, sort_order);
create index if not exists training_session_exercises_exercise_idx
  on public.training_session_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- Ownership gate (same relationships as trait management in migration 019)
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_pedigree_horse_training(p_pedigree_horse_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.pedigree_horses ph
      where ph.id = p_pedigree_horse_id
        and ph.created_by = auth.uid()
    )
    or exists (
      select 1
      from public.horse_listings hl
      where hl.pedigree_horse_id = p_pedigree_horse_id
        and hl.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.stallions s
      where s.pedigree_horse_id = p_pedigree_horse_id
        and s.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.stallions s
      inner join public.breeders b on b.id = s.breeder_id
      where s.pedigree_horse_id = p_pedigree_horse_id
        and b.owner_id = auth.uid()
    );
$$;

create or replace function public.can_use_exercise_in_training(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exercises e
    where e.id = p_exercise_id
      and (
        e.source = 'system'
        or e.created_by = auth.uid()
        or public.is_admin()
      )
  );
$$;

revoke all on function public.can_manage_pedigree_horse_training(uuid) from public;
grant execute on function public.can_manage_pedigree_horse_training(uuid) to authenticated;

revoke all on function public.can_use_exercise_in_training(uuid) from public;
grant execute on function public.can_use_exercise_in_training(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_exercises_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exercises_updated_at on public.exercises;
create trigger exercises_updated_at
before update on public.exercises
for each row
execute function public.set_exercises_updated_at();

create or replace function public.set_training_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_plans_updated_at on public.training_plans;
create trigger training_plans_updated_at
before update on public.training_plans
for each row
execute function public.set_training_plans_updated_at();

create or replace function public.set_training_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_sessions_updated_at on public.training_sessions;
create trigger training_sessions_updated_at
before update on public.training_sessions
for each row
execute function public.set_training_sessions_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------
create or replace function public.enforce_exercises_source()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.source = 'system' then
      if not public.is_admin() then
        raise exception 'Only admins can create system exercises.';
      end if;
      new.created_by := null;
    else
      new.created_by := coalesce(new.created_by, auth.uid());
      if new.created_by is distinct from auth.uid() then
        raise exception 'User exercises must be created by the authenticated user.';
      end if;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.source is distinct from new.source then
      raise exception 'Exercise source cannot be changed.';
    end if;

    if new.source = 'system' then
      if not public.is_admin() then
        raise exception 'Only admins can update system exercises.';
      end if;
      new.created_by := null;
    elsif new.created_by is distinct from old.created_by then
      raise exception 'created_by cannot be changed on user exercises.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists exercises_enforce_source on public.exercises;
create trigger exercises_enforce_source
before insert or update on public.exercises
for each row
execute function public.enforce_exercises_source();

create or replace function public.protect_training_plans_created_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed on training_plans.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plans_protect_created_by on public.training_plans;
create trigger training_plans_protect_created_by
before update on public.training_plans
for each row
execute function public.protect_training_plans_created_by();

create or replace function public.protect_training_sessions_created_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed on training_sessions.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_sessions_protect_created_by on public.training_sessions;
create trigger training_sessions_protect_created_by
before update on public.training_sessions
for each row
execute function public.protect_training_sessions_created_by();

create or replace function public.enforce_training_session_integrity()
returns trigger
language plpgsql
as $$
declare
  v_plan_owner uuid;
begin
  if new.training_plan_id is not null then
    select tp.created_by
    into v_plan_owner
    from public.training_plans tp
    where tp.id = new.training_plan_id;

    if v_plan_owner is null then
      raise exception 'Training plan not found.';
    end if;

    if v_plan_owner is distinct from new.created_by then
      raise exception 'Training session creator must match the linked training plan owner.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists training_sessions_enforce_integrity on public.training_sessions;
create trigger training_sessions_enforce_integrity
before insert or update on public.training_sessions
for each row
execute function public.enforce_training_session_integrity();

create or replace function public.enforce_training_session_exercise_integrity()
returns trigger
language plpgsql
as $$
declare
  v_session_owner uuid;
begin
  select ts.created_by
  into v_session_owner
  from public.training_sessions ts
  where ts.id = new.training_session_id;

  if v_session_owner is null then
    raise exception 'Training session not found.';
  end if;

  if v_session_owner is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Training session exercises must belong to the session owner.';
  end if;

  if not public.can_use_exercise_in_training(new.exercise_id) then
    raise exception 'Exercise is not available for this training session.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_session_exercises_enforce_integrity on public.training_session_exercises;
create trigger training_session_exercises_enforce_integrity
before insert or update on public.training_session_exercises
for each row
execute function public.enforce_training_session_exercise_integrity();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_session_exercises enable row level security;

-- exercises
drop policy if exists "Authenticated can read system and own exercises" on public.exercises;
create policy "Authenticated can read system and own exercises"
on public.exercises
for select
to authenticated
using (
  source = 'system'
  or created_by = auth.uid()
);

drop policy if exists "Users can create own user exercises" on public.exercises;
create policy "Users can create own user exercises"
on public.exercises
for insert
to authenticated
with check (
  source = 'user'
  and created_by = auth.uid()
);

drop policy if exists "Users can update own user exercises" on public.exercises;
create policy "Users can update own user exercises"
on public.exercises
for update
to authenticated
using (source = 'user' and created_by = auth.uid())
with check (source = 'user' and created_by = auth.uid());

drop policy if exists "Users can delete own user exercises" on public.exercises;
create policy "Users can delete own user exercises"
on public.exercises
for delete
to authenticated
using (source = 'user' and created_by = auth.uid());

drop policy if exists "Admins can manage all exercises" on public.exercises;
create policy "Admins can manage all exercises"
on public.exercises
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training_plans
drop policy if exists "Users can read own training plans" on public.training_plans;
create policy "Users can read own training plans"
on public.training_plans
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own training plans" on public.training_plans;
create policy "Users can create own training plans"
on public.training_plans
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update own training plans" on public.training_plans;
create policy "Users can update own training plans"
on public.training_plans
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete own training plans" on public.training_plans;
create policy "Users can delete own training plans"
on public.training_plans
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can read all training plans" on public.training_plans;
create policy "Admins can read all training plans"
on public.training_plans
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage all training plans" on public.training_plans;
create policy "Admins can manage all training plans"
on public.training_plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training_sessions
drop policy if exists "Users can read own training sessions" on public.training_sessions;
create policy "Users can read own training sessions"
on public.training_sessions
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own training sessions" on public.training_sessions;
create policy "Users can create own training sessions"
on public.training_sessions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own training sessions" on public.training_sessions;
create policy "Users can update own training sessions"
on public.training_sessions
for update
to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own training sessions" on public.training_sessions;
create policy "Users can delete own training sessions"
on public.training_sessions
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can read all training sessions" on public.training_sessions;
create policy "Admins can read all training sessions"
on public.training_sessions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage all training sessions" on public.training_sessions;
create policy "Admins can manage all training sessions"
on public.training_sessions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training_session_exercises (access via parent session ownership)
drop policy if exists "Users can read own session exercises" on public.training_session_exercises;
create policy "Users can read own session exercises"
on public.training_session_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_session_id
      and ts.created_by = auth.uid()
  )
);

drop policy if exists "Users can create own session exercises" on public.training_session_exercises;
create policy "Users can create own session exercises"
on public.training_session_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_session_id
      and ts.created_by = auth.uid()
  )
  and public.can_use_exercise_in_training(exercise_id)
);

drop policy if exists "Users can update own session exercises" on public.training_session_exercises;
create policy "Users can update own session exercises"
on public.training_session_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_session_id
      and ts.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_session_id
      and ts.created_by = auth.uid()
  )
  and public.can_use_exercise_in_training(exercise_id)
);

drop policy if exists "Users can delete own session exercises" on public.training_session_exercises;
create policy "Users can delete own session exercises"
on public.training_session_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_session_id
      and ts.created_by = auth.uid()
  )
);

drop policy if exists "Admins can manage all session exercises" on public.training_session_exercises;
create policy "Admins can manage all session exercises"
on public.training_session_exercises
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.exercises from anon;
revoke all on public.training_plans from anon;
revoke all on public.training_sessions from anon;
revoke all on public.training_session_exercises from anon;

grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.training_plans to authenticated;
grant select, insert, update, delete on public.training_sessions to authenticated;
grant select, insert, update, delete on public.training_session_exercises to authenticated;
