-- SHABDIZ: permanent horse care / health history
create table if not exists public.horse_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid not null references public.horse_listings(id) on delete cascade,
  record_type text not null,
  record_date timestamptz not null default now(),
  title text not null,
  provider text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists horse_health_records_user_date_idx
  on public.horse_health_records(user_id, record_date desc);
create index if not exists horse_health_records_horse_date_idx
  on public.horse_health_records(horse_id, record_date desc);

alter table public.horse_health_records enable row level security;
drop policy if exists "Users can read own horse health records" on public.horse_health_records;
create policy "Users can read own horse health records" on public.horse_health_records for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create own horse health records" on public.horse_health_records;
create policy "Users can create own horse health records" on public.horse_health_records for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own horse health records" on public.horse_health_records;
create policy "Users can update own horse health records" on public.horse_health_records for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own horse health records" on public.horse_health_records;
create policy "Users can delete own horse health records" on public.horse_health_records for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.horse_health_records to authenticated;
