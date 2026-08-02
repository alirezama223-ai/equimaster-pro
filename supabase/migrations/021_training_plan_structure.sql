-- EquiMaster Pro Phase 15.1: Training Plan structure (design for review)
-- Run manually in Supabase Dashboard → SQL Editor (after migration 020).
--
-- Adds relational structure for multi-week reusable training plans.
-- Does NOT alter public.training_plans.
--
-- Entity graph:
--   training_plans (existing)
--     └── training_plan_weeks        (1..N weeks, ordered by week_number)
--           └── training_plan_days   (1..7 day slots per week, day_number 1–7)
--                 └── training_plan_exercises (0..N exercises per day, sort_order)

-- ---------------------------------------------------------------------------
-- training_plan_weeks — ordered week blocks within a plan
-- ---------------------------------------------------------------------------
create table if not exists public.training_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans (id) on delete cascade,
  week_number integer not null check (week_number >= 1),
  title text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_weeks_unique_number
    unique (training_plan_id, week_number),
  constraint training_plan_weeks_title_not_blank check (
    title is null or length(trim(title)) > 0
  ),
  constraint training_plan_weeks_goal_not_blank check (
    goal is null or length(trim(goal)) > 0
  )
);

create index if not exists training_plan_weeks_plan_idx
  on public.training_plan_weeks (training_plan_id, week_number);

create index if not exists training_plan_weeks_created_at_idx
  on public.training_plan_weeks (created_at desc);

-- ---------------------------------------------------------------------------
-- training_plan_days — seven day slots per week (day_number 1–7)
-- ---------------------------------------------------------------------------
create table if not exists public.training_plan_days (
  id uuid primary key default gen_random_uuid(),
  training_plan_week_id uuid not null references public.training_plan_weeks (id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  title text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_days_unique_number
    unique (training_plan_week_id, day_number),
  constraint training_plan_days_title_not_blank check (
    title is null or length(trim(title)) > 0
  ),
  constraint training_plan_days_goal_not_blank check (
    goal is null or length(trim(goal)) > 0
  )
);

create index if not exists training_plan_days_week_idx
  on public.training_plan_days (training_plan_week_id, day_number);

create index if not exists training_plan_days_created_at_idx
  on public.training_plan_days (created_at desc);

-- ---------------------------------------------------------------------------
-- training_plan_exercises — ordered exercise slots on a plan day
-- ---------------------------------------------------------------------------
create table if not exists public.training_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  training_plan_day_id uuid not null references public.training_plan_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  notes text,
  target_duration_minutes integer check (
    target_duration_minutes is null or target_duration_minutes > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_plan_exercises_unique_order
    unique (training_plan_day_id, sort_order),
  constraint training_plan_exercises_notes_not_blank check (
    notes is null or length(trim(notes)) > 0
  )
);

create index if not exists training_plan_exercises_day_idx
  on public.training_plan_exercises (training_plan_day_id, sort_order);

create index if not exists training_plan_exercises_exercise_idx
  on public.training_plan_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- Ownership helpers (plan owner or admin)
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_training_plan(p_training_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_plans tp
    where tp.id = p_training_plan_id
      and (
        tp.created_by = auth.uid()
        or public.is_admin()
      )
  );
$$;

create or replace function public.can_manage_training_plan_week(p_training_plan_week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_plan_weeks w
    inner join public.training_plans tp on tp.id = w.training_plan_id
    where w.id = p_training_plan_week_id
      and (
        tp.created_by = auth.uid()
        or public.is_admin()
      )
  );
$$;

create or replace function public.can_manage_training_plan_day(p_training_plan_day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_plan_days d
    inner join public.training_plan_weeks w on w.id = d.training_plan_week_id
    inner join public.training_plans tp on tp.id = w.training_plan_id
    where d.id = p_training_plan_day_id
      and (
        tp.created_by = auth.uid()
        or public.is_admin()
      )
  );
$$;

revoke all on function public.can_manage_training_plan(uuid) from public;
grant execute on function public.can_manage_training_plan(uuid) to authenticated;

revoke all on function public.can_manage_training_plan_week(uuid) from public;
grant execute on function public.can_manage_training_plan_week(uuid) to authenticated;

revoke all on function public.can_manage_training_plan_day(uuid) from public;
grant execute on function public.can_manage_training_plan_day(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_training_plan_weeks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_plan_weeks_updated_at on public.training_plan_weeks;
create trigger training_plan_weeks_updated_at
before update on public.training_plan_weeks
for each row
execute function public.set_training_plan_weeks_updated_at();

create or replace function public.set_training_plan_days_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_plan_days_updated_at on public.training_plan_days;
create trigger training_plan_days_updated_at
before update on public.training_plan_days
for each row
execute function public.set_training_plan_days_updated_at();

create or replace function public.set_training_plan_exercises_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_plan_exercises_updated_at on public.training_plan_exercises;
create trigger training_plan_exercises_updated_at
before update on public.training_plan_exercises
for each row
execute function public.set_training_plan_exercises_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------
create or replace function public.enforce_training_plan_week_integrity()
returns trigger
language plpgsql
as $$
begin
  if not public.can_manage_training_plan(new.training_plan_id) then
    raise exception 'Training plan weeks must belong to a plan you manage.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plan_weeks_enforce_integrity on public.training_plan_weeks;
create trigger training_plan_weeks_enforce_integrity
before insert or update on public.training_plan_weeks
for each row
execute function public.enforce_training_plan_week_integrity();

create or replace function public.enforce_training_plan_day_integrity()
returns trigger
language plpgsql
as $$
begin
  if not public.can_manage_training_plan_week(new.training_plan_week_id) then
    raise exception 'Training plan days must belong to a week you manage.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plan_days_enforce_integrity on public.training_plan_days;
create trigger training_plan_days_enforce_integrity
before insert or update on public.training_plan_days
for each row
execute function public.enforce_training_plan_day_integrity();

create or replace function public.enforce_training_plan_exercise_integrity()
returns trigger
language plpgsql
as $$
begin
  if not public.can_manage_training_plan_day(new.training_plan_day_id) then
    raise exception 'Training plan exercises must belong to a day you manage.';
  end if;

  if not public.can_use_exercise_in_training(new.exercise_id) then
    raise exception 'Exercise is not available for this training plan.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plan_exercises_enforce_integrity on public.training_plan_exercises;
create trigger training_plan_exercises_enforce_integrity
before insert or update on public.training_plan_exercises
for each row
execute function public.enforce_training_plan_exercise_integrity();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.training_plan_weeks enable row level security;
alter table public.training_plan_days enable row level security;
alter table public.training_plan_exercises enable row level security;

-- training_plan_weeks
drop policy if exists "Users can read own plan weeks" on public.training_plan_weeks;
create policy "Users can read own plan weeks"
on public.training_plan_weeks
for select
to authenticated
using (public.can_manage_training_plan(training_plan_id));

drop policy if exists "Users can create own plan weeks" on public.training_plan_weeks;
create policy "Users can create own plan weeks"
on public.training_plan_weeks
for insert
to authenticated
with check (public.can_manage_training_plan(training_plan_id));

drop policy if exists "Users can update own plan weeks" on public.training_plan_weeks;
create policy "Users can update own plan weeks"
on public.training_plan_weeks
for update
to authenticated
using (public.can_manage_training_plan(training_plan_id))
with check (public.can_manage_training_plan(training_plan_id));

drop policy if exists "Users can delete own plan weeks" on public.training_plan_weeks;
create policy "Users can delete own plan weeks"
on public.training_plan_weeks
for delete
to authenticated
using (public.can_manage_training_plan(training_plan_id));

drop policy if exists "Admins can manage all plan weeks" on public.training_plan_weeks;
create policy "Admins can manage all plan weeks"
on public.training_plan_weeks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training_plan_days
drop policy if exists "Users can read own plan days" on public.training_plan_days;
create policy "Users can read own plan days"
on public.training_plan_days
for select
to authenticated
using (public.can_manage_training_plan_week(training_plan_week_id));

drop policy if exists "Users can create own plan days" on public.training_plan_days;
create policy "Users can create own plan days"
on public.training_plan_days
for insert
to authenticated
with check (public.can_manage_training_plan_week(training_plan_week_id));

drop policy if exists "Users can update own plan days" on public.training_plan_days;
create policy "Users can update own plan days"
on public.training_plan_days
for update
to authenticated
using (public.can_manage_training_plan_week(training_plan_week_id))
with check (public.can_manage_training_plan_week(training_plan_week_id));

drop policy if exists "Users can delete own plan days" on public.training_plan_days;
create policy "Users can delete own plan days"
on public.training_plan_days
for delete
to authenticated
using (public.can_manage_training_plan_week(training_plan_week_id));

drop policy if exists "Admins can manage all plan days" on public.training_plan_days;
create policy "Admins can manage all plan days"
on public.training_plan_days
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training_plan_exercises
drop policy if exists "Users can read own plan exercises" on public.training_plan_exercises;
create policy "Users can read own plan exercises"
on public.training_plan_exercises
for select
to authenticated
using (public.can_manage_training_plan_day(training_plan_day_id));

drop policy if exists "Users can create own plan exercises" on public.training_plan_exercises;
create policy "Users can create own plan exercises"
on public.training_plan_exercises
for insert
to authenticated
with check (
  public.can_manage_training_plan_day(training_plan_day_id)
  and public.can_use_exercise_in_training(exercise_id)
);

drop policy if exists "Users can update own plan exercises" on public.training_plan_exercises;
create policy "Users can update own plan exercises"
on public.training_plan_exercises
for update
to authenticated
using (public.can_manage_training_plan_day(training_plan_day_id))
with check (
  public.can_manage_training_plan_day(training_plan_day_id)
  and public.can_use_exercise_in_training(exercise_id)
);

drop policy if exists "Users can delete own plan exercises" on public.training_plan_exercises;
create policy "Users can delete own plan exercises"
on public.training_plan_exercises
for delete
to authenticated
using (public.can_manage_training_plan_day(training_plan_day_id));

drop policy if exists "Admins can manage all plan exercises" on public.training_plan_exercises;
create policy "Admins can manage all plan exercises"
on public.training_plan_exercises
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.training_plan_weeks from anon;
revoke all on public.training_plan_days from anon;
revoke all on public.training_plan_exercises from anon;

grant select, insert, update, delete on public.training_plan_weeks to authenticated;
grant select, insert, update, delete on public.training_plan_days to authenticated;
grant select, insert, update, delete on public.training_plan_exercises to authenticated;
