-- EquiMaster Pro Phase 15.4: Training Plan persistence helpers
-- Run manually in Supabase Dashboard → SQL Editor (after migration 021).
--
-- Adds rest-day flag and atomic save RPC for plan structure.
-- Note: day exercise rows live in training_plan_exercises (Phase 15.1 name).

alter table public.training_plan_days
  add column if not exists is_rest_day boolean not null default false;

-- ---------------------------------------------------------------------------
-- save_training_plan_structure — replace full plan structure atomically
-- ---------------------------------------------------------------------------
create or replace function public.save_training_plan_structure(
  p_training_plan_id uuid,
  p_weeks jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week jsonb;
  v_day jsonb;
  v_exercise jsonb;
  v_week_id uuid;
  v_day_id uuid;
  v_exercise_id uuid;
  v_is_rest_day boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if not public.can_manage_training_plan(p_training_plan_id) then
    raise exception 'Training plan not found or access denied.';
  end if;

  if p_weeks is null or jsonb_typeof(p_weeks) <> 'array' then
    raise exception 'Plan weeks payload must be a JSON array.';
  end if;

  delete from public.training_plan_weeks
  where training_plan_id = p_training_plan_id;

  for v_week in
    select value
    from jsonb_array_elements(p_weeks)
  loop
    if coalesce((v_week ->> 'weekNumber')::integer, 0) < 1 then
      raise exception 'Each week must have weekNumber >= 1.';
    end if;

    insert into public.training_plan_weeks (
      training_plan_id,
      week_number,
      title,
      goal
    )
    values (
      p_training_plan_id,
      (v_week ->> 'weekNumber')::integer,
      nullif(trim(v_week ->> 'title'), ''),
      nullif(trim(v_week ->> 'goal'), '')
    )
    returning id into v_week_id;

    if jsonb_typeof(v_week -> 'days') <> 'array' then
      raise exception 'Each week must include a days array.';
    end if;

    for v_day in
      select value
      from jsonb_array_elements(v_week -> 'days')
    loop
      if (v_day ->> 'dayNumber')::integer not between 1 and 7 then
        raise exception 'Each day must have dayNumber between 1 and 7.';
      end if;

      v_is_rest_day := coalesce((v_day ->> 'isRestDay')::boolean, false);

      insert into public.training_plan_days (
        training_plan_week_id,
        day_number,
        title,
        goal,
        is_rest_day
      )
      values (
        v_week_id,
        (v_day ->> 'dayNumber')::integer,
        nullif(trim(v_day ->> 'title'), ''),
        nullif(trim(v_day ->> 'goal'), ''),
        v_is_rest_day
      )
      returning id into v_day_id;

      if v_is_rest_day then
        continue;
      end if;

      if jsonb_typeof(v_day -> 'exercises') <> 'array' then
        raise exception 'Each day must include an exercises array.';
      end if;

      for v_exercise in
        select value
        from jsonb_array_elements(v_day -> 'exercises')
      loop
        v_exercise_id := (v_exercise ->> 'exerciseId')::uuid;

        if v_exercise_id is null then
          raise exception 'Each exercise must include exerciseId.';
        end if;

        if not public.can_use_exercise_in_training(v_exercise_id) then
          raise exception 'Exercise % is not available for this training plan.', v_exercise_id;
        end if;

        if coalesce((v_exercise ->> 'sortOrder')::integer, -1) < 0 then
          raise exception 'Each exercise must have sortOrder >= 0.';
        end if;

        insert into public.training_plan_exercises (
          training_plan_day_id,
          exercise_id,
          sort_order,
          notes,
          target_duration_minutes
        )
        values (
          v_day_id,
          v_exercise_id,
          (v_exercise ->> 'sortOrder')::integer,
          nullif(trim(v_exercise ->> 'notes'), ''),
          nullif((v_exercise ->> 'targetDurationMinutes')::integer, 0)
        );
      end loop;
    end loop;
  end loop;

  update public.training_plans
  set updated_at = now()
  where id = p_training_plan_id;
end;
$$;

revoke all on function public.save_training_plan_structure(uuid, jsonb) from public;
grant execute on function public.save_training_plan_structure(uuid, jsonb) to authenticated;
