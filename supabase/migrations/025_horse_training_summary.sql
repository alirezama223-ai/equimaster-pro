-- EquiMaster Pro: Horse training analytics summary view
-- Run manually in Supabase SQL Editor after migration 024.

create or replace view public.horse_training_summary
with (security_invoker = true)
as
with session_base as (
  select
    ts.created_by,
    ts.pedigree_horse_id,
    ts.id,
    ts.session_date,
    ts.status,
    ts.rider_rating,
    ts.duration_minutes
  from public.training_sessions ts
),
completed_days as (
  select distinct
    sb.created_by,
    sb.pedigree_horse_id,
    sb.session_date
  from session_base sb
  where sb.status = 'completed'
),
streak_groups as (
  select
    cd.created_by,
    cd.pedigree_horse_id,
    cd.session_date,
    cd.session_date
      + (
        row_number() over (
          partition by cd.created_by, cd.pedigree_horse_id
          order by cd.session_date desc
        )
      )::integer as streak_group
  from completed_days cd
),
streak_lengths as (
  select
    sg.created_by,
    sg.pedigree_horse_id,
    sg.streak_group,
    count(*)::integer as streak_length,
    max(sg.session_date) as streak_end_date
  from streak_groups sg
  group by sg.created_by, sg.pedigree_horse_id, sg.streak_group
),
current_streaks as (
  select distinct on (sl.created_by, sl.pedigree_horse_id)
    sl.created_by,
    sl.pedigree_horse_id,
    sl.streak_length as current_training_streak
  from streak_lengths sl
  where sl.streak_end_date >= current_date - 1
  order by sl.created_by, sl.pedigree_horse_id, sl.streak_end_date desc, sl.streak_length desc
),
last_sessions as (
  select distinct on (sb.created_by, sb.pedigree_horse_id)
    sb.created_by,
    sb.pedigree_horse_id,
    sb.id as last_session_id,
    sb.session_date as last_session_date
  from session_base sb
  where sb.status = 'completed'
  order by sb.created_by, sb.pedigree_horse_id, sb.session_date desc, sb.id desc
),
aggregates as (
  select
    sb.created_by,
    sb.pedigree_horse_id,
    count(*)::integer as total_sessions,
    count(*) filter (where sb.status = 'completed')::integer as completed_sessions,
    round(
      100.0 * count(*) filter (where sb.status = 'completed') / nullif(count(*), 0),
      1
    ) as completion_rate,
    round(avg(sb.rider_rating) filter (where sb.rider_rating is not null), 1) as average_rating,
    round(avg(sb.duration_minutes) filter (where sb.duration_minutes is not null), 0) as average_duration_minutes
  from session_base sb
  group by sb.created_by, sb.pedigree_horse_id
)
select
  a.created_by,
  a.pedigree_horse_id,
  ph.name as horse_name,
  a.total_sessions,
  a.completed_sessions,
  a.completion_rate,
  a.average_rating,
  a.average_duration_minutes,
  coalesce(cs.current_training_streak, 0) as current_training_streak,
  ls.last_session_date,
  ls.last_session_id
from aggregates a
inner join public.pedigree_horses ph on ph.id = a.pedigree_horse_id
left join current_streaks cs
  on cs.created_by = a.created_by
 and cs.pedigree_horse_id = a.pedigree_horse_id
left join last_sessions ls
  on ls.created_by = a.created_by
 and ls.pedigree_horse_id = a.pedigree_horse_id;

grant select on public.horse_training_summary to authenticated;
