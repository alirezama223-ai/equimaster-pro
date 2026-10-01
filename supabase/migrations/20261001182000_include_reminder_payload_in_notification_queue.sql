create or replace function public.enqueue_due_reminders(p_now timestamp with time zone default now(), p_horizon_minutes integer default 0)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  inserted_count integer := 0;
begin
  insert into public.notification_queue (reminder_id, user_id, channel, scheduled_for, payload)
  select
    r.id,
    r.user_id,
    'push',
    r.due_at - make_interval(mins => r.remind_before_minutes),
    jsonb_build_object(
      'title', r.title,
      'body', coalesce(nullif(r.description, ''), 'You have a new EquiMaster reminder.'),
      'url', '/account/reminders'
    )
  from public.reminders r
  where r.enabled = true
    and r.status = 'pending'
    and (r.due_at - make_interval(mins => r.remind_before_minutes)) <= p_now + make_interval(mins => greatest(p_horizon_minutes, 0))
    and (r.due_at - make_interval(mins => r.remind_before_minutes)) > p_now - interval '24 hours'
  on conflict (reminder_id, channel, scheduled_for) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$;
