-- Persist execution state for exercises inside a training session.
-- Kept intentionally additive so existing sessions remain valid.

alter table public.training_session_exercises
  add column if not exists status text not null default 'pending',
  add column if not exists execution_notes text;

alter table public.training_session_exercises
  drop constraint if exists training_session_exercises_status_check;

alter table public.training_session_exercises
  add constraint training_session_exercises_status_check
  check (status in ('pending', 'in_progress', 'completed', 'skipped'));

create index if not exists idx_training_session_exercises_status
  on public.training_session_exercises(status);
