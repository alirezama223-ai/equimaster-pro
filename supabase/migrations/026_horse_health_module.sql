-- EquiMaster Pro Sprint 027: Horse Health & Wellness module
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–025).
--
-- Creates horse_health_checks, horse_injuries, horse_farrier_visits,
-- horse_vet_visits, horse_vaccinations, horse_medications.
-- Reuses can_manage_pedigree_horse_training ownership gate from migration 020.
-- No seed data.

-- ---------------------------------------------------------------------------
-- horse_health_checks — daily wellness observations
-- ---------------------------------------------------------------------------
create table if not exists public.horse_health_checks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  check_date date not null default current_date,
  temperature_celsius numeric(4, 1) check (
    temperature_celsius is null
    or (temperature_celsius >= 35.0 and temperature_celsius <= 42.0)
  ),
  appetite text check (
    appetite is null or appetite in ('good', 'reduced', 'poor')
  ),
  hydration text check (
    hydration is null or hydration in ('good', 'low')
  ),
  attitude text check (
    attitude is null or attitude in ('normal', 'dull', 'anxious')
  ),
  manure text check (
    manure is null or manure in ('normal', 'loose', 'none')
  ),
  lameness_observed boolean not null default false,
  lameness_notes text,
  fever_observed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_health_checks_unique_daily unique (created_by, pedigree_horse_id, check_date)
);

create index if not exists horse_health_checks_created_by_idx
  on public.horse_health_checks (created_by);
create index if not exists horse_health_checks_pedigree_horse_id_idx
  on public.horse_health_checks (pedigree_horse_id);
create index if not exists horse_health_checks_check_date_idx
  on public.horse_health_checks (check_date desc);

-- ---------------------------------------------------------------------------
-- horse_injuries
-- ---------------------------------------------------------------------------
create table if not exists public.horse_injuries (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  injury_date date not null default current_date,
  body_area text not null,
  severity text not null default 'mild' check (
    severity in ('mild', 'moderate', 'severe')
  ),
  status text not null default 'active' check (
    status in ('active', 'recovering', 'resolved')
  ),
  description text,
  treatment_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_injuries_body_area_not_blank check (length(trim(body_area)) > 0)
);

create index if not exists horse_injuries_created_by_idx
  on public.horse_injuries (created_by);
create index if not exists horse_injuries_pedigree_horse_id_idx
  on public.horse_injuries (pedigree_horse_id);
create index if not exists horse_injuries_status_idx
  on public.horse_injuries (status)
  where status in ('active', 'recovering');

-- ---------------------------------------------------------------------------
-- horse_farrier_visits
-- ---------------------------------------------------------------------------
create table if not exists public.horse_farrier_visits (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  visit_date date not null default current_date,
  next_due_date date,
  work_done text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_farrier_visits_date_order check (
    next_due_date is null or next_due_date >= visit_date
  )
);

create index if not exists horse_farrier_visits_created_by_idx
  on public.horse_farrier_visits (created_by);
create index if not exists horse_farrier_visits_pedigree_horse_id_idx
  on public.horse_farrier_visits (pedigree_horse_id);
create index if not exists horse_farrier_visits_visit_date_idx
  on public.horse_farrier_visits (visit_date desc);

-- ---------------------------------------------------------------------------
-- horse_vet_visits
-- ---------------------------------------------------------------------------
create table if not exists public.horse_vet_visits (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  visit_date date not null default current_date,
  reason text not null,
  diagnosis text,
  treatment text,
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_vet_visits_reason_not_blank check (length(trim(reason)) > 0),
  constraint horse_vet_visits_follow_up_order check (
    follow_up_date is null or follow_up_date >= visit_date
  )
);

create index if not exists horse_vet_visits_created_by_idx
  on public.horse_vet_visits (created_by);
create index if not exists horse_vet_visits_pedigree_horse_id_idx
  on public.horse_vet_visits (pedigree_horse_id);
create index if not exists horse_vet_visits_visit_date_idx
  on public.horse_vet_visits (visit_date desc);

-- ---------------------------------------------------------------------------
-- horse_vaccinations
-- ---------------------------------------------------------------------------
create table if not exists public.horse_vaccinations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  vaccine_name text not null,
  administered_date date not null default current_date,
  next_due_date date,
  batch_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_vaccinations_name_not_blank check (length(trim(vaccine_name)) > 0),
  constraint horse_vaccinations_due_order check (
    next_due_date is null or next_due_date >= administered_date
  )
);

create index if not exists horse_vaccinations_created_by_idx
  on public.horse_vaccinations (created_by);
create index if not exists horse_vaccinations_pedigree_horse_id_idx
  on public.horse_vaccinations (pedigree_horse_id);
create index if not exists horse_vaccinations_administered_date_idx
  on public.horse_vaccinations (administered_date desc);

-- ---------------------------------------------------------------------------
-- horse_medications
-- ---------------------------------------------------------------------------
create table if not exists public.horse_medications (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  pedigree_horse_id uuid not null references public.pedigree_horses (id) on delete cascade,
  medication_name text not null,
  start_date date not null default current_date,
  end_date date,
  dosage text,
  frequency text,
  reason text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horse_medications_name_not_blank check (length(trim(medication_name)) > 0),
  constraint horse_medications_date_order check (
    end_date is null or end_date >= start_date
  )
);

create index if not exists horse_medications_created_by_idx
  on public.horse_medications (created_by);
create index if not exists horse_medications_pedigree_horse_id_idx
  on public.horse_medications (pedigree_horse_id);
create index if not exists horse_medications_active_idx
  on public.horse_medications (is_active)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_horse_health_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists horse_health_checks_updated_at on public.horse_health_checks;
create trigger horse_health_checks_updated_at
before update on public.horse_health_checks
for each row
execute function public.set_horse_health_row_updated_at();

drop trigger if exists horse_injuries_updated_at on public.horse_injuries;
create trigger horse_injuries_updated_at
before update on public.horse_injuries
for each row
execute function public.set_horse_health_row_updated_at();

drop trigger if exists horse_farrier_visits_updated_at on public.horse_farrier_visits;
create trigger horse_farrier_visits_updated_at
before update on public.horse_farrier_visits
for each row
execute function public.set_horse_health_row_updated_at();

drop trigger if exists horse_vet_visits_updated_at on public.horse_vet_visits;
create trigger horse_vet_visits_updated_at
before update on public.horse_vet_visits
for each row
execute function public.set_horse_health_row_updated_at();

drop trigger if exists horse_vaccinations_updated_at on public.horse_vaccinations;
create trigger horse_vaccinations_updated_at
before update on public.horse_vaccinations
for each row
execute function public.set_horse_health_row_updated_at();

drop trigger if exists horse_medications_updated_at on public.horse_medications;
create trigger horse_medications_updated_at
before update on public.horse_medications
for each row
execute function public.set_horse_health_row_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.horse_health_checks enable row level security;
alter table public.horse_injuries enable row level security;
alter table public.horse_farrier_visits enable row level security;
alter table public.horse_vet_visits enable row level security;
alter table public.horse_vaccinations enable row level security;
alter table public.horse_medications enable row level security;

-- horse_health_checks
drop policy if exists "Users can read own health checks" on public.horse_health_checks;
create policy "Users can read own health checks"
on public.horse_health_checks for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own health checks" on public.horse_health_checks;
create policy "Users can create own health checks"
on public.horse_health_checks for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own health checks" on public.horse_health_checks;
create policy "Users can update own health checks"
on public.horse_health_checks for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own health checks" on public.horse_health_checks;
create policy "Users can delete own health checks"
on public.horse_health_checks for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all health checks" on public.horse_health_checks;
create policy "Admins can manage all health checks"
on public.horse_health_checks for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- horse_injuries
drop policy if exists "Users can read own injuries" on public.horse_injuries;
create policy "Users can read own injuries"
on public.horse_injuries for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own injuries" on public.horse_injuries;
create policy "Users can create own injuries"
on public.horse_injuries for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own injuries" on public.horse_injuries;
create policy "Users can update own injuries"
on public.horse_injuries for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own injuries" on public.horse_injuries;
create policy "Users can delete own injuries"
on public.horse_injuries for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all injuries" on public.horse_injuries;
create policy "Admins can manage all injuries"
on public.horse_injuries for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- horse_farrier_visits
drop policy if exists "Users can read own farrier visits" on public.horse_farrier_visits;
create policy "Users can read own farrier visits"
on public.horse_farrier_visits for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own farrier visits" on public.horse_farrier_visits;
create policy "Users can create own farrier visits"
on public.horse_farrier_visits for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own farrier visits" on public.horse_farrier_visits;
create policy "Users can update own farrier visits"
on public.horse_farrier_visits for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own farrier visits" on public.horse_farrier_visits;
create policy "Users can delete own farrier visits"
on public.horse_farrier_visits for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all farrier visits" on public.horse_farrier_visits;
create policy "Admins can manage all farrier visits"
on public.horse_farrier_visits for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- horse_vet_visits
drop policy if exists "Users can read own vet visits" on public.horse_vet_visits;
create policy "Users can read own vet visits"
on public.horse_vet_visits for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own vet visits" on public.horse_vet_visits;
create policy "Users can create own vet visits"
on public.horse_vet_visits for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own vet visits" on public.horse_vet_visits;
create policy "Users can update own vet visits"
on public.horse_vet_visits for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own vet visits" on public.horse_vet_visits;
create policy "Users can delete own vet visits"
on public.horse_vet_visits for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all vet visits" on public.horse_vet_visits;
create policy "Admins can manage all vet visits"
on public.horse_vet_visits for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- horse_vaccinations
drop policy if exists "Users can read own vaccinations" on public.horse_vaccinations;
create policy "Users can read own vaccinations"
on public.horse_vaccinations for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own vaccinations" on public.horse_vaccinations;
create policy "Users can create own vaccinations"
on public.horse_vaccinations for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own vaccinations" on public.horse_vaccinations;
create policy "Users can update own vaccinations"
on public.horse_vaccinations for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own vaccinations" on public.horse_vaccinations;
create policy "Users can delete own vaccinations"
on public.horse_vaccinations for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all vaccinations" on public.horse_vaccinations;
create policy "Admins can manage all vaccinations"
on public.horse_vaccinations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- horse_medications
drop policy if exists "Users can read own medications" on public.horse_medications;
create policy "Users can read own medications"
on public.horse_medications for select to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create own medications" on public.horse_medications;
create policy "Users can create own medications"
on public.horse_medications for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can update own medications" on public.horse_medications;
create policy "Users can update own medications"
on public.horse_medications for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and public.can_manage_pedigree_horse_training(pedigree_horse_id)
);

drop policy if exists "Users can delete own medications" on public.horse_medications;
create policy "Users can delete own medications"
on public.horse_medications for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Admins can manage all medications" on public.horse_medications;
create policy "Admins can manage all medications"
on public.horse_medications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.horse_health_checks from anon;
revoke all on public.horse_injuries from anon;
revoke all on public.horse_farrier_visits from anon;
revoke all on public.horse_vet_visits from anon;
revoke all on public.horse_vaccinations from anon;
revoke all on public.horse_medications from anon;

grant select, insert, update, delete on public.horse_health_checks to authenticated;
grant select, insert, update, delete on public.horse_injuries to authenticated;
grant select, insert, update, delete on public.horse_farrier_visits to authenticated;
grant select, insert, update, delete on public.horse_vet_visits to authenticated;
grant select, insert, update, delete on public.horse_vaccinations to authenticated;
grant select, insert, update, delete on public.horse_medications to authenticated;
