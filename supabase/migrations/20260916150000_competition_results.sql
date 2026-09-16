alter table public.competitions
  add column if not exists result_rank integer,
  add column if not exists score numeric,
  add column if not exists faults numeric,
  add column if not exists result_notes text;

alter table public.competitions
  drop constraint if exists competitions_result_rank_check,
  drop constraint if exists competitions_faults_check;

alter table public.competitions
  add constraint competitions_result_rank_check check (result_rank is null or result_rank >= 1),
  add constraint competitions_faults_check check (faults is null or faults >= 0);
