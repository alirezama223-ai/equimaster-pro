-- EquiMaster Pro Phase 11: horse trait assessments + mare breeding goals
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–018).
--
-- Security notes:
-- - Trait INSERT requires real horse ownership/management (not created_by alone).
-- - Non-admins may only submit owner_reported / breeder_reported source types.
-- - verified is protected by trigger; non-admins cannot self-verify.
-- - Public reads use horse_trait_assessments_public (no created_by / source_note).
-- - mare_breeding_goals remain private to the owning user.

create table if not exists public.horse_trait_assessments (
  id uuid primary key default gen_random_uuid(),
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  trait_key text not null,
  score numeric(4, 2) not null check (score >= 1 and score <= 5),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  source_type text not null check (
    source_type in (
      'owner_reported',
      'breeder_reported',
      'admin_assessed',
      'verified_record',
      'performance_data',
      'offspring_data'
    )
  ),
  source_note text,
  verified boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists horse_trait_assessments_pedigree_horse_id_idx
  on public.horse_trait_assessments (pedigree_horse_id);
create index if not exists horse_trait_assessments_trait_key_idx
  on public.horse_trait_assessments (trait_key);
create index if not exists horse_trait_assessments_verified_idx
  on public.horse_trait_assessments (verified);
create index if not exists horse_trait_assessments_created_at_idx
  on public.horse_trait_assessments (created_at desc);
create index if not exists horse_trait_assessments_created_by_idx
  on public.horse_trait_assessments (created_by)
  where created_by is not null;

create table if not exists public.mare_breeding_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mare_pedigree_id uuid not null references public.pedigree_horses (id) on delete cascade,
  goals jsonb not null default '[]'::jsonb,
  preserve_traits jsonb not null default '[]'::jsonb,
  avoid_reinforcing_weaknesses boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mare_breeding_goals_user_mare_unique unique (user_id, mare_pedigree_id),
  constraint mare_breeding_goals_goals_is_array check (jsonb_typeof(goals) = 'array'),
  constraint mare_breeding_goals_preserve_is_array check (jsonb_typeof(preserve_traits) = 'array')
);

create index if not exists mare_breeding_goals_user_id_idx on public.mare_breeding_goals (user_id);
create index if not exists mare_breeding_goals_mare_idx on public.mare_breeding_goals (mare_pedigree_id);

create or replace function public.set_horse_trait_assessments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists horse_trait_assessments_updated_at on public.horse_trait_assessments;
create trigger horse_trait_assessments_updated_at
before update on public.horse_trait_assessments
for each row
execute function public.set_horse_trait_assessments_updated_at();

create or replace function public.set_mare_breeding_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mare_breeding_goals_updated_at on public.mare_breeding_goals;
create trigger mare_breeding_goals_updated_at
before update on public.mare_breeding_goals
for each row
execute function public.set_mare_breeding_goals_updated_at();

-- Ownership/management gate for trait submissions.
-- Matches existing EquiMaster Pro relationships:
-- pedigree creator, listing owner, stallion owner, stud-farm (breeder) owner.
create or replace function public.can_manage_pedigree_horse_traits(p_pedigree_horse_id uuid)
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

revoke all on function public.can_manage_pedigree_horse_traits(uuid) from public;
grant execute on function public.can_manage_pedigree_horse_traits(uuid) to authenticated;

create or replace function public.protect_horse_trait_assessment_verified()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
  elsif tg_op = 'UPDATE' then
    new.verified := old.verified;
  end if;

  return new;
end;
$$;

drop trigger if exists horse_trait_assessments_protect_verified on public.horse_trait_assessments;
create trigger horse_trait_assessments_protect_verified
before insert or update on public.horse_trait_assessments
for each row
execute function public.protect_horse_trait_assessment_verified();

create or replace function public.enforce_horse_trait_assessment_submission()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    if new.created_by is null then
      new.created_by := auth.uid();
    end if;
    return new;
  end if;

  new.created_by := auth.uid();
  new.verified := false;

  if new.source_type not in ('owner_reported', 'breeder_reported') then
    raise exception 'source_type % is not allowed for non-admin trait submissions', new.source_type;
  end if;

  if not public.can_manage_pedigree_horse_traits(new.pedigree_horse_id) then
    raise exception 'not authorized to submit trait assessments for pedigree horse %', new.pedigree_horse_id;
  end if;

  return new;
end;
$$;

drop trigger if exists horse_trait_assessments_enforce_submission on public.horse_trait_assessments;
create trigger horse_trait_assessments_enforce_submission
before insert on public.horse_trait_assessments
for each row
execute function public.enforce_horse_trait_assessment_submission();

create or replace function public.enforce_horse_trait_assessment_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.pedigree_horse_id is distinct from old.pedigree_horse_id
     or new.created_by is distinct from old.created_by
     or new.source_type is distinct from old.source_type then
    raise exception 'trait assessment identity fields cannot be changed by non-admin users';
  end if;

  if new.source_type not in ('owner_reported', 'breeder_reported') then
    raise exception 'source_type % is not allowed for non-admin trait updates', new.source_type;
  end if;

  if not public.can_manage_pedigree_horse_traits(new.pedigree_horse_id) then
    raise exception 'not authorized to update trait assessments for pedigree horse %', new.pedigree_horse_id;
  end if;

  return new;
end;
$$;

drop trigger if exists horse_trait_assessments_enforce_update on public.horse_trait_assessments;
create trigger horse_trait_assessments_enforce_update
before update on public.horse_trait_assessments
for each row
execute function public.enforce_horse_trait_assessment_update();

-- Public-safe read surface (excludes created_by and source_note).
create or replace view public.horse_trait_assessments_public
with (security_invoker = false)
as
select
  id,
  pedigree_horse_id,
  trait_key,
  score,
  confidence,
  source_type,
  verified,
  created_at,
  updated_at
from public.horse_trait_assessments;

alter table public.horse_trait_assessments enable row level security;
alter table public.mare_breeding_goals enable row level security;

drop policy if exists "Public can read horse trait assessments" on public.horse_trait_assessments;
drop policy if exists "Authenticated can create trait assessments" on public.horse_trait_assessments;
drop policy if exists "Creators can update unverified trait assessments" on public.horse_trait_assessments;
drop policy if exists "Creators can delete unverified trait assessments" on public.horse_trait_assessments;
drop policy if exists "Admins can update horse trait assessments" on public.horse_trait_assessments;
drop policy if exists "Admins can delete horse trait assessments" on public.horse_trait_assessments;

drop policy if exists "Admins can read all horse trait assessments" on public.horse_trait_assessments;
create policy "Admins can read all horse trait assessments"
on public.horse_trait_assessments
for select
to authenticated
using (public.is_admin());

drop policy if exists "Managers can read managed horse trait assessments" on public.horse_trait_assessments;
create policy "Managers can read managed horse trait assessments"
on public.horse_trait_assessments
for select
to authenticated
using (public.can_manage_pedigree_horse_traits(pedigree_horse_id));

drop policy if exists "Creators can read own horse trait assessments" on public.horse_trait_assessments;
create policy "Creators can read own horse trait assessments"
on public.horse_trait_assessments
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Managers can create horse trait assessments" on public.horse_trait_assessments;
create policy "Managers can create horse trait assessments"
on public.horse_trait_assessments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_traits(pedigree_horse_id)
  and source_type in ('owner_reported', 'breeder_reported')
);

drop policy if exists "Admins can create horse trait assessments" on public.horse_trait_assessments;
create policy "Admins can create horse trait assessments"
on public.horse_trait_assessments
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Creators can update unverified trait assessments" on public.horse_trait_assessments;
create policy "Creators can update unverified trait assessments"
on public.horse_trait_assessments
for update
to authenticated
using (
  created_by = auth.uid()
  and verified = false
  and public.can_manage_pedigree_horse_traits(pedigree_horse_id)
)
with check (
  created_by = auth.uid()
  and verified = false
  and public.can_manage_pedigree_horse_traits(pedigree_horse_id)
  and source_type in ('owner_reported', 'breeder_reported')
);

drop policy if exists "Admins can update horse trait assessments" on public.horse_trait_assessments;
create policy "Admins can update horse trait assessments"
on public.horse_trait_assessments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Creators can delete unverified trait assessments" on public.horse_trait_assessments;
create policy "Creators can delete unverified trait assessments"
on public.horse_trait_assessments
for delete
to authenticated
using (
  created_by = auth.uid()
  and verified = false
  and public.can_manage_pedigree_horse_traits(pedigree_horse_id)
);

drop policy if exists "Admins can delete horse trait assessments" on public.horse_trait_assessments;
create policy "Admins can delete horse trait assessments"
on public.horse_trait_assessments
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Users can read own mare breeding goals" on public.mare_breeding_goals;
create policy "Users can read own mare breeding goals"
on public.mare_breeding_goals
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own mare breeding goals" on public.mare_breeding_goals;
create policy "Users can create own mare breeding goals"
on public.mare_breeding_goals
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own mare breeding goals" on public.mare_breeding_goals;
create policy "Users can update own mare breeding goals"
on public.mare_breeding_goals
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own mare breeding goals" on public.mare_breeding_goals;
create policy "Users can delete own mare breeding goals"
on public.mare_breeding_goals
for delete
to authenticated
using (user_id = auth.uid());

revoke all on public.horse_trait_assessments from anon;
revoke all on public.mare_breeding_goals from anon;

grant select on public.horse_trait_assessments_public to anon, authenticated;
grant insert, update, delete on public.horse_trait_assessments to authenticated;
grant select on public.horse_trait_assessments to authenticated;
grant select, insert, update, delete on public.mare_breeding_goals to authenticated;
