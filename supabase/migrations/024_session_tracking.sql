-- EquiMaster Pro Phase 2: Session tracking
-- Run manually in Supabase SQL Editor after migration 020.

alter table public.training_session_exercises
  add column if not exists status text not null default 'pending';

alter table public.training_session_exercises
  drop constraint if exists training_session_exercises_status_check;

alter table public.training_session_exercises
  add constraint training_session_exercises_status_check
  check (status in ('pending', 'in_progress', 'completed', 'skipped'));

alter table public.training_session_exercises
  add column if not exists execution_notes text;

alter table public.training_sessions
  add column if not exists rider_rating integer;

alter table public.training_sessions
  drop constraint if exists training_sessions_rider_rating_check;

alter table public.training_sessions
  add constraint training_sessions_rider_rating_check
  check (rider_rating is null or (rider_rating >= 1 and rider_rating <= 10));

alter table public.training_sessions
  add column if not exists horse_feeling text;

alter table public.training_sessions
  add column if not exists coach_notes text;

alter table public.training_sessions
  add column if not exists started_at timestamptz;

create index if not exists training_session_exercises_status_idx
  on public.training_session_exercises (training_session_id, status);
