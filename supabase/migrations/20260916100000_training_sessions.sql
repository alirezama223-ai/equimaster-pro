-- SHABDIZ: training session history
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid not null references public.horse_listings(id) on delete cascade,
  training_date timestamptz not null default now(),
  discipline text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  rating integer check (rating is null or rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists training_sessions_user_date_idx
  on public.training_sessions(user_id, training_date desc);
create index if not exists training_sessions_horse_date_idx
  on public.training_sessions(horse_id, training_date desc);

alter table public.training_sessions enable row level security;

drop policy if exists "Users can read own training sessions" on public.training_sessions;
create policy "Users can read own training sessions"
on public.training_sessions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own training sessions" on public.training_sessions;
create policy "Users can create own training sessions"
on public.training_sessions for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own training sessions" on public.training_sessions;
create policy "Users can update own training sessions"
on public.training_sessions for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own training sessions" on public.training_sessions;
create policy "Users can delete own training sessions"
on public.training_sessions for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.training_sessions to authenticated;
