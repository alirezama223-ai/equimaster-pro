-- EquiMaster Pro Phase 15.5: Training Plan horse assignments
-- Run manually in Supabase Dashboard → SQL Editor (after migration 022).
--
-- Links reusable training plans to managed horses (one plan per horse).

create table if not exists public.training_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint training_plan_assignments_unique_horse unique (pedigree_horse_id),
  constraint training_plan_assignments_unique_plan_horse unique (training_plan_id, pedigree_horse_id)
);

create index if not exists training_plan_assignments_plan_idx
  on public.training_plan_assignments (training_plan_id);

create index if not exists training_plan_assignments_horse_idx
  on public.training_plan_assignments (pedigree_horse_id);

create index if not exists training_plan_assignments_created_by_idx
  on public.training_plan_assignments (created_by);

-- ---------------------------------------------------------------------------
-- save_training_plan_assignments — replace plan horse assignments atomically
-- ---------------------------------------------------------------------------
create or replace function public.save_training_plan_assignments(
  p_training_plan_id uuid,
  p_horse_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_horse_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if not public.can_manage_training_plan(p_training_plan_id) then
    raise exception 'Training plan not found or access denied.';
  end if;

  delete from public.training_plan_assignments
  where training_plan_id = p_training_plan_id;

  if p_horse_ids is null or cardinality(p_horse_ids) = 0 then
    return;
  end if;

  foreach v_horse_id in array p_horse_ids
  loop
    if not public.can_manage_pedigree_horse_training(v_horse_id) then
      raise exception 'Horse % cannot be assigned to this training plan.', v_horse_id;
    end if;

    delete from public.training_plan_assignments
    where pedigree_horse_id = v_horse_id;

    insert into public.training_plan_assignments (
      training_plan_id,
      pedigree_horse_id,
      created_by
    )
    values (
      p_training_plan_id,
      v_horse_id,
      auth.uid()
    );
  end loop;
end;
$$;

revoke all on function public.save_training_plan_assignments(uuid, uuid[]) from public;
grant execute on function public.save_training_plan_assignments(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- save_training_plan_full_state — structure + assignments in one transaction
-- ---------------------------------------------------------------------------
create or replace function public.save_training_plan_full_state(
  p_training_plan_id uuid,
  p_weeks jsonb,
  p_horse_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.save_training_plan_structure(p_training_plan_id, p_weeks);
  perform public.save_training_plan_assignments(p_training_plan_id, p_horse_ids);
end;
$$;

revoke all on function public.save_training_plan_full_state(uuid, jsonb, uuid[]) from public;
grant execute on function public.save_training_plan_full_state(uuid, jsonb, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.training_plan_assignments enable row level security;

drop policy if exists "Users can read own plan assignments" on public.training_plan_assignments;
create policy "Users can read own plan assignments"
on public.training_plan_assignments
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own plan assignments" on public.training_plan_assignments;
create policy "Users can create own plan assignments"
on public.training_plan_assignments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_training_plan(training_plan_id)
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own plan assignments" on public.training_plan_assignments;
create policy "Users can update own plan assignments"
on public.training_plan_assignments
for update
to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_training_plan(training_plan_id)
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own plan assignments" on public.training_plan_assignments;
create policy "Users can delete own plan assignments"
on public.training_plan_assignments
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all plan assignments" on public.training_plan_assignments;
create policy "Admins can manage all plan assignments"
on public.training_plan_assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.training_plan_assignments from anon;
grant select, insert, update, delete on public.training_plan_assignments to authenticated;
