create table if not exists public.competition_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  sort_order integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (competition_id, title)
);
create index if not exists competition_checklist_user_idx on public.competition_checklist_items(user_id);
create index if not exists competition_checklist_competition_idx on public.competition_checklist_items(competition_id, sort_order);
alter table public.competition_checklist_items enable row level security;
drop policy if exists "Users can view own competition checklist" on public.competition_checklist_items;
create policy "Users can view own competition checklist" on public.competition_checklist_items for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Users can insert own competition checklist" on public.competition_checklist_items;
create policy "Users can insert own competition checklist" on public.competition_checklist_items for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Users can update own competition checklist" on public.competition_checklist_items;
create policy "Users can update own competition checklist" on public.competition_checklist_items for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "Users can delete own competition checklist" on public.competition_checklist_items;
create policy "Users can delete own competition checklist" on public.competition_checklist_items for delete to authenticated using (auth.uid()=user_id);
grant select, insert, update, delete on public.competition_checklist_items to authenticated;
