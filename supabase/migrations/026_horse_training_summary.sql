create or replace view public.horse_training_summary
with (security_invoker = true)
as
with session_days as (
  select
    ts.created_by,
    ts.pedigree_horse_id,
    ts.session_date,
    ts.id,
    ts.status,
    ts.rider_rating,
    ts.duration_minutes,
    row_number() over (
      partition by ts.created_by, ts.pedigree_horse_id
      order by ts.session_date desc, ts.created_at desc
    ) as rn
  from public.training_sessions ts
),
summary as (
  select
    created_by,
    pedigree_horse_id,
    count(*)::int as total_sessions,
    count(*) filter (where status = 'completed')::int as completed_sessions,
    avg(rider_rating)::numeric as average_rating,
    avg(duration_minutes)::numeric as average_duration_minutes,
    max(session_date) as last_session_date,
    (array_agg(id order by session_date desc, rn asc))[1] as last_session_id
  from session_days
  group by created_by, pedigree_horse_id
),
completed_dates as (
  select distinct created_by, pedigree_horse_id, session_date
  from public.training_sessions
  where status = 'completed'
),
streaks as (
  select
    cd.created_by,
    cd.pedigree_horse_id,
    cd.session_date,
    cd.session_date - (row_number() over (
      partition by cd.created_by, cd.pedigree_horse_id
      order by cd.session_date desc
    ))::int as grp
  from completed_dates cd
),
streak_summary as (
  select
    s.created_by,
    s.pedigree_horse_id,
    count(*)::int as current_training_streak
  from streaks s
  join (
    select created_by, pedigree_horse_id, max(session_date) as last_completed_date
    from completed_dates
    group by created_by, pedigree_horse_id
  ) latest
    on latest.created_by = s.created_by
   and latest.pedigree_horse_id = s.pedigree_horse_id
   and latest.last_completed_date = s.session_date
  where s.grp = (
    select s2.grp
    from streaks s2
    where s2.created_by = s.created_by
      and s2.pedigree_horse_id = s.pedigree_horse_id
      and s2.session_date = latest.last_completed_date
    limit 1
  )
  group by s.created_by, s.pedigree_horse_id
)
select
  s.pedigree_horse_id,
  ph.name as horse_name,
  s.created_by,
  s.total_sessions,
  s.completed_sessions,
  case when s.total_sessions = 0 then 0::numeric
       else round((s.completed_sessions::numeric / s.total_sessions::numeric) * 100, 2)
  end as completion_rate,
  round(s.average_rating, 2) as average_rating,
  round(s.average_duration_minutes, 2) as average_duration_minutes,
  coalesce(ss.current_training_streak, 0) as current_training_streak,
  s.last_session_date,
  s.last_session_id
from summary s
join public.pedigree_horses ph on ph.id = s.pedigree_horse_id
left join streak_summary ss
  on ss.created_by = s.created_by
 and ss.pedigree_horse_id = s.pedigree_horse_id;

grant select on public.horse_training_summary to authenticated;
