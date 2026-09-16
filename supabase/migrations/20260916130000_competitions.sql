create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid references public.horse_listings(id) on delete set null,
  name text not null,
  venue text,
  class_name text,
  discipline text,
  competition_date timestamptz not null,
  notes text,
  status text not null default 'planned' check (status in ('planned','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists competitions_user_date_idx on public.competitions(user_id, competition_date);
create index if not exists competitions_horse_date_idx on public.competitions(horse_id, competition_date);
alter table public.competitions enable row level security;
create policy "Users can view own competitions" on public.competitions for select using (auth.uid() = user_id);
create policy "Users can create own competitions" on public.competitions for insert with check (auth.uid() = user_id);
create policy "Users can update own competitions" on public.competitions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own competitions" on public.competitions for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.competitions to authenticated;
