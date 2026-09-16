alter table public.competitions
  add column if not exists result_rank integer,
  add column if not exists score numeric,
  add column if not exists faults integer,
  add column if not exists result_notes text;

alter table public.competitions
  drop constraint if exists competitions_result_rank_check;
alter table public.competitions
  add constraint competitions_result_rank_check check (result_rank is null or result_rank >= 1);

alter table public.competitions
  drop constraint if exists competitions_score_check;
alter table public.competitions
  add constraint competitions_score_check check (score is null or score >= 0);

alter table public.competitions
  drop constraint if exists competitions_faults_check;
alter table public.competitions
  add constraint competitions_faults_check check (faults is null or faults >= 0);
