-- EquiMaster Pro Phase 14.3.1: Daily Training sample seed
-- Schema: supabase/migrations/020_daily_training_foundation.sql
-- Run in Supabase SQL Editor after migration 020.
-- Idempotent (fixed UUIDs + ON CONFLICT).

DO $seed$
DECLARE
  v_user_id uuid := 'd3ef910d-25b3-432a-802d-aaf947e27f18';
  v_horse_id uuid := 'c3bd4d79-d00e-489d-8a45-8d6180133c1c';
  v_plan_id uuid := 'f1430001-0001-4001-8001-000000000001';
  v_session_id uuid := 'f1430003-0001-4001-8001-000000000001';
  v_ex_warmup uuid := 'f1430002-0001-4001-8001-000000000001';
  v_ex_polework uuid := 'f1430002-0001-4001-8001-000000000002';
  v_ex_flatwork uuid := 'f1430002-0001-4001-8001-000000000003';
  v_ex_gymnastic uuid := 'f1430002-0001-4001-8001-000000000004';
  v_ex_cooldown uuid := 'f1430002-0001-4001-8001-000000000005';
  v_plan_start date;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'auth.users row missing for %', v_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.pedigree_horses WHERE id = v_horse_id) THEN
    RAISE EXCEPTION 'pedigree_horses row missing for %', v_horse_id;
  END IF;

  v_plan_start := current_date - 9;

  -- Bypass auth.uid()-dependent triggers (enforce_exercises_source,
  -- enforce_training_session_exercise_integrity) for SQL Editor service role.
  ALTER TABLE public.exercises DISABLE TRIGGER exercises_enforce_source;
  ALTER TABLE public.training_session_exercises DISABLE TRIGGER training_session_exercises_enforce_integrity;

  INSERT INTO public.training_plans (
    id,
    created_by,
    name,
    description,
    status,
    start_date,
    end_date
  )
  VALUES (
    v_plan_id,
    v_user_id,
    'Foundation & Scope Week',
    'Maintain rhythm and straightness through poles before adding height.',
    'active',
    v_plan_start,
    v_plan_start + 27
  )
  ON CONFLICT (id) DO UPDATE SET
    created_by = EXCLUDED.created_by,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = now();

  INSERT INTO public.exercises (
    id,
    source,
    created_by,
    name,
    description,
    category,
    discipline,
    difficulty,
    duration_minutes
  )
  VALUES
    (
      v_ex_warmup,
      'user',
      v_user_id,
      'Warm-up',
      'Loosening walk, trot, and light suppling on both reins.',
      'warmup',
      'Show Jumping',
      'beginner',
      10
    ),
    (
      v_ex_polework,
      'user',
      v_user_id,
      'Pole Work',
      'Trot poles on a circle and straight line to establish rhythm and balance.',
      'polework',
      'Show Jumping',
      'intermediate',
      15
    ),
    (
      v_ex_flatwork,
      'user',
      v_user_id,
      'Flatwork',
      'Transitions and lateral work to improve straightness before jumping.',
      'flatwork',
      'Show Jumping',
      'intermediate',
      15
    ),
    (
      v_ex_gymnastic,
      'user',
      v_user_id,
      'Gymnastic Line',
      'Short gymnastic grid focusing on bascule and steady pace.',
      'jumping',
      'Show Jumping',
      'advanced',
      10
    ),
    (
      v_ex_cooldown,
      'user',
      v_user_id,
      'Cool-down',
      'Walk on a long rein and stretch to finish the session calmly.',
      'cooldown',
      'Show Jumping',
      'beginner',
      5
    )
  ON CONFLICT (id) DO UPDATE SET
    source = EXCLUDED.source,
    created_by = EXCLUDED.created_by,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    discipline = EXCLUDED.discipline,
    difficulty = EXCLUDED.difficulty,
    duration_minutes = EXCLUDED.duration_minutes,
    updated_at = now();

  INSERT INTO public.training_sessions (
    id,
    created_by,
    pedigree_horse_id,
    training_plan_id,
    session_date,
    title,
    notes,
    session_goal,
    energy_level,
    confidence,
    status,
    duration_minutes
  )
  VALUES (
    v_session_id,
    v_user_id,
    v_horse_id,
    v_plan_id,
    current_date,
    'Pole rhythm & balance',
    'Horse stayed relaxed and maintained rhythm through the pole exercises.',
    'Maintain rhythm and straightness through poles before adding height.',
    'moderate',
    'high',
    'completed',
    45
  )
  ON CONFLICT (id) DO UPDATE SET
    created_by = EXCLUDED.created_by,
    pedigree_horse_id = EXCLUDED.pedigree_horse_id,
    training_plan_id = EXCLUDED.training_plan_id,
    session_date = current_date,
    title = EXCLUDED.title,
    notes = EXCLUDED.notes,
    session_goal = EXCLUDED.session_goal,
    energy_level = EXCLUDED.energy_level,
    confidence = EXCLUDED.confidence,
    status = EXCLUDED.status,
    duration_minutes = EXCLUDED.duration_minutes,
    updated_at = now();

  INSERT INTO public.training_session_exercises (
    id,
    training_session_id,
    exercise_id,
    sort_order,
    duration_minutes
  )
  VALUES
    ('f1430004-0001-4001-8001-000000000001', v_session_id, v_ex_warmup, 0, 10),
    ('f1430004-0001-4001-8001-000000000002', v_session_id, v_ex_polework, 1, 15),
    ('f1430004-0001-4001-8001-000000000003', v_session_id, v_ex_flatwork, 2, 15),
    ('f1430004-0001-4001-8001-000000000004', v_session_id, v_ex_gymnastic, 3, 10),
    ('f1430004-0001-4001-8001-000000000005', v_session_id, v_ex_cooldown, 4, 5)
  ON CONFLICT (id) DO UPDATE SET
    training_session_id = EXCLUDED.training_session_id,
    exercise_id = EXCLUDED.exercise_id,
    sort_order = EXCLUDED.sort_order,
    duration_minutes = EXCLUDED.duration_minutes;

  ALTER TABLE public.exercises ENABLE TRIGGER exercises_enforce_source;
  ALTER TABLE public.training_session_exercises ENABLE TRIGGER training_session_exercises_enforce_integrity;
END $seed$;

SELECT
  tp.id AS plan_id,
  tp.name AS plan_name,
  tp.status AS plan_status,
  tp.start_date,
  ts.id AS session_id,
  ts.session_date,
  ts.title AS session_title,
  ts.status AS session_status,
  ts.duration_minutes,
  count(tse.id) AS linked_exercises
FROM public.training_plans tp
LEFT JOIN public.training_sessions ts
  ON ts.id = 'f1430003-0001-4001-8001-000000000001'
LEFT JOIN public.training_session_exercises tse
  ON tse.training_session_id = ts.id
WHERE tp.id = 'f1430001-0001-4001-8001-000000000001'
GROUP BY
  tp.id,
  tp.name,
  tp.status,
  tp.start_date,
  ts.id,
  ts.session_date,
  ts.title,
  ts.status,
  ts.duration_minutes;

SELECT
  tse.sort_order,
  e.name AS exercise_name,
  e.category,
  e.discipline,
  e.difficulty,
  tse.duration_minutes
FROM public.training_session_exercises tse
INNER JOIN public.exercises e ON e.id = tse.exercise_id
WHERE tse.training_session_id = 'f1430003-0001-4001-8001-000000000001'
ORDER BY tse.sort_order;
