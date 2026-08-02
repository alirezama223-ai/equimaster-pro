-- EquiMaster Pro: training plan ownership helper (dependency for 022/023)
-- Run after migration 020 and before migration 023 if 021 was not applied.
--
-- Migration 021 defines public.can_manage_training_plan(uuid) together with
-- training_plan_weeks/days/exercises. Environments that applied 022 or 023
-- without 021 need this function available first.

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

revoke all on function public.can_manage_training_plan(uuid) from public;
grant execute on function public.can_manage_training_plan(uuid) to authenticated;
