-- Section B: permissions for migration 021 (paste into Supabase SQL Editor)
-- Run AFTER Section A (structure tables + indexes).
-- Requires: public.training_plans, public.exercises, public.is_admin(),
--           public.can_use_exercise_in_training() from earlier migrations.

-- ---------------------------------------------------------------------------
-- Ownership helpers (required by RLS policies)
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
