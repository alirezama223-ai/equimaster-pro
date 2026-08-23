-- EquiMaster Pro: persisted marketplace searches
-- Run this manually in Supabase Dashboard → SQL Editor

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx
  on public.saved_searches (user_id);

create index if not exists saved_searches_user_id_updated_at_idx
  on public.saved_searches (user_id, updated_at desc);

alter table public.saved_searches enable row level security;

drop policy if exists "Users can read own saved searches" on public.saved_searches;
create policy "Users can read own saved searches"
on public.saved_searches
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved searches" on public.saved_searches;
create policy "Users can insert own saved searches"
on public.saved_searches
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved searches" on public.saved_searches;
create policy "Users can update own saved searches"
on public.saved_searches
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved searches" on public.saved_searches;
create policy "Users can delete own saved searches"
on public.saved_searches
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_searches to authenticated;
