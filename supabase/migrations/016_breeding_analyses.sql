-- EquiMaster Pro Phase 9: saved breeding analyses
-- Run manually in Supabase Dashboard → SQL Editor (after migrations 001–015).

create table if not exists public.breeding_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mare_pedigree_id uuid not null references public.pedigree_horses (id) on delete cascade,
  stallion_pedigree_id uuid not null references public.pedigree_horses (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breeding_analyses_distinct_parents check (mare_pedigree_id <> stallion_pedigree_id)
);

create index if not exists breeding_analyses_user_id_idx on public.breeding_analyses (user_id);
create index if not exists breeding_analyses_mare_idx on public.breeding_analyses (mare_pedigree_id);
create index if not exists breeding_analyses_stallion_idx on public.breeding_analyses (stallion_pedigree_id);
create index if not exists breeding_analyses_created_at_idx on public.breeding_analyses (created_at desc);

create or replace function public.set_breeding_analyses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists breeding_analyses_updated_at on public.breeding_analyses;
create trigger breeding_analyses_updated_at
before update on public.breeding_analyses
for each row
execute function public.set_breeding_analyses_updated_at();

alter table public.breeding_analyses enable row level security;

drop policy if exists "Users can read own breeding analyses" on public.breeding_analyses;
create policy "Users can read own breeding analyses"
on public.breeding_analyses
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own breeding analyses" on public.breeding_analyses;
create policy "Users can create own breeding analyses"
on public.breeding_analyses
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own breeding analyses" on public.breeding_analyses;
create policy "Users can update own breeding analyses"
on public.breeding_analyses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own breeding analyses" on public.breeding_analyses;
create policy "Users can delete own breeding analyses"
on public.breeding_analyses
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.breeding_analyses to authenticated;
