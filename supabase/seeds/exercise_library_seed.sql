-- EquiMaster Pro: Exercise Library seed (50 system catalog exercises)
-- Schema: supabase/migrations/020_daily_training_foundation.sql
-- Run in Supabase SQL Editor after migration 020.
-- Idempotent: fixed UUIDs + ON CONFLICT (id) DO NOTHING.
--
-- Category mapping (UI label -> DB enum):
--   Warm-up    -> warmup
--   Flatwork   -> flatwork
--   Jumping    -> jumping
--   Fitness    -> conditioning
--   Recovery   -> cooldown
--   Groundwork -> groundwork
--
-- Note: recommended_level is stored in description (no dedicated column in 020).

ALTER TABLE public.exercises DISABLE TRIGGER exercises_enforce_source;

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
    'f1430004-0001-4001-8001-000000000001'::uuid,
    'system',
    null,
    'Active Walk on Long Rein',
    'Loosen the back with a forward, marching walk on a long rein in both directions. Recommended level: Novice / green horse.',
    'warmup',
    'Dressage',
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000002'::uuid,
    'system',
    null,
    'Progressive Trot Warm-up',
    'Build rhythm with rising trot on 20 m circles, gradually adding straight lines. Recommended level: Novice.',
    'warmup',
    'Dressage',
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000003'::uuid,
    'system',
    null,
    'Suppling Bends at Walk',
    'Ride shallow serpentines with clear inside bend and outside rein support. Recommended level: Training level.',
    'warmup',
    'Dressage',
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000004'::uuid,
    'system',
    null,
    'Shoulder-Fore Introduction',
    'Ask for slight shoulder-fore on the long side to activate the inside hind leg. Recommended level: Training level.',
    'warmup',
    'Dressage',
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000005'::uuid,
    'system',
    null,
    'Walk-Trot Transition Warm-up',
    'Practice crisp walk-trot-walk transitions on a circle to establish responsiveness. Recommended level: Novice.',
    'warmup',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000006'::uuid,
    'system',
    null,
    'Leg Yield at Walk',
    'Yield sideways from the quarter line toward the track while maintaining forward walk. Recommended level: Training level.',
    'warmup',
    'Dressage',
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000007'::uuid,
    'system',
    null,
    'Spiral In and Out at Trot',
    'Spiral from 20 m to 15 m and back out to improve balance and bend. Recommended level: First level.',
    'warmup',
    'Dressage',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000008'::uuid,
    'system',
    null,
    'Stretching Circle at Trot',
    'Encourage long neck and forward reach on a large circle before collected work. Recommended level: All levels.',
    'warmup',
    'Dressage',
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000009'::uuid,
    'system',
    null,
    '20-Meter Circle Accuracy',
    'Maintain equal bend and tempo on 20 m circles in both directions. Recommended level: Novice.',
    'flatwork',
    'Dressage',
    'beginner',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000010'::uuid,
    'system',
    null,
    'Center Line Straightness',
    'Ride accurate center lines with straight body alignment and even contact. Recommended level: Training level.',
    'flatwork',
    'Dressage',
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000011'::uuid,
    'system',
    null,
    'Shoulder-In on Long Side',
    'Three-track shoulder-in for three strides, then straighten and reward. Recommended level: First level.',
    'flatwork',
    'Dressage',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000012'::uuid,
    'system',
    null,
    'Haunches-In (Travers)',
    'Introduce travers on the long side with inside hind stepping under. Recommended level: Second level.',
    'flatwork',
    'Dressage',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000013'::uuid,
    'system',
    null,
    'Counter Canter on Circle',
    'Hold correct counter canter on a 20 m circle without falling in. Recommended level: Second level.',
    'flatwork',
    'Dressage',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000014'::uuid,
    'system',
    null,
    'Simple Changes of Lead',
    'Canter-walk-canter transitions for clear lead changes without tempi. Recommended level: Training level.',
    'flatwork',
    null,
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000015'::uuid,
    'system',
    null,
    'Lengthening and Collection at Trot',
    'Alternate medium trot with working trot on diagonals. Recommended level: First level.',
    'flatwork',
    'Dressage',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000016'::uuid,
    'system',
    null,
    'Leg Yield to Quarter Line',
    'Leg yield from the track to the quarter line and back with steady rhythm. Recommended level: Training level.',
    'flatwork',
    'Dressage',
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000017'::uuid,
    'system',
    null,
    'Half Pass Introduction',
    'Short half-pass steps from the long side toward center line. Recommended level: Second level.',
    'flatwork',
    'Dressage',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000018'::uuid,
    'system',
    null,
    'Halt, Immobility, and Reward',
    'Square halt from trot, hold immobility for three seconds, then praise. Recommended level: Novice.',
    'flatwork',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000019'::uuid,
    'system',
    null,
    'Crossrail Grid',
    'Trot into a simple crossrail grid focusing on straight approach and steady pace. Recommended level: Novice.',
    'jumping',
    'Show Jumping',
    'beginner',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000020'::uuid,
    'system',
    null,
    'Vertical Line Practice',
    'Ride a single vertical with consistent distance and soft landing. Recommended level: Training level.',
    'jumping',
    'Show Jumping',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000021'::uuid,
    'system',
    null,
    'Oxer Combination',
    'Two-stride oxer combination to develop scope and confidence. Recommended level: First level.',
    'jumping',
    'Show Jumping',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000022'::uuid,
    'system',
    null,
    'Bounce Grid',
    'Short bounce grid at trot or canter for quick front-end technique. Recommended level: First level.',
    'jumping',
    'Show Jumping',
    'advanced',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000023'::uuid,
    'system',
    null,
    'Related Distance Lines',
    'Practice set distances between two fences on a related line. Recommended level: Training level.',
    'jumping',
    'Show Jumping',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000024'::uuid,
    'system',
    null,
    'Course Walk and Jump',
    'Walk the course on foot, then ride fences in planned order. Recommended level: First level.',
    'jumping',
    'Show Jumping',
    'intermediate',
    20
  ),
  (
    'f1430004-0001-4001-8001-000000000025'::uuid,
    'system',
    null,
    'Skinny Fence Accuracy',
    'Jump narrow fillers or standards to improve straightness and focus. Recommended level: Second level.',
    'jumping',
    'Show Jumping',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000026'::uuid,
    'system',
    null,
    'Rollback Turn to Fence',
    'Canter fence, rollback turn, and jump the same or adjacent fence. Recommended level: First level.',
    'jumping',
    'Hunter',
    'advanced',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000027'::uuid,
    'system',
    null,
    'Trot Pole to Crossrail',
    'Trot poles into a crossrail to establish rhythm before height. Recommended level: Novice.',
    'jumping',
    'Show Jumping',
    'beginner',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000028'::uuid,
    'system',
    null,
    'Hill Work Intervals',
    'Alternate walking and trotting uphill to build cardiovascular strength. Recommended level: Eventing prep.',
    'conditioning',
    'Eventing',
    'intermediate',
    20
  ),
  (
    'f1430004-0001-4001-8001-000000000029'::uuid,
    'system',
    null,
    'Trot Sets on Flat',
    'Repeated two-minute trot sets with one-minute walk breaks. Recommended level: Base fitness.',
    'conditioning',
    null,
    'intermediate',
    20
  ),
  (
    'f1430004-0001-4001-8001-000000000030'::uuid,
    'system',
    null,
    'Canter Interval Training',
    'Three canter intervals of two minutes with walk recovery between. Recommended level: Competition prep.',
    'conditioning',
    'Eventing',
    'advanced',
    20
  ),
  (
    'f1430004-0001-4001-8001-000000000031'::uuid,
    'system',
    null,
    'Pole Work Cardio Circuit',
    'Continuous trot over ground poles in a loop for stamina and coordination. Recommended level: General fitness.',
    'conditioning',
    'Show Jumping',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000032'::uuid,
    'system',
    null,
    'Endurance Trot on Track',
    'Sustained working trot around the arena or track for aerobic base. Recommended level: Base fitness.',
    'conditioning',
    null,
    'intermediate',
    25
  ),
  (
    'f1430004-0001-4001-8001-000000000033'::uuid,
    'system',
    null,
    'Cavaletti Trot Sets',
    'Trot over raised cavaletti on a circle to strengthen core and limbs. Recommended level: Training level.',
    'conditioning',
    'Dressage',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000034'::uuid,
    'system',
    null,
    'Canter Transitions for Stamina',
    'Repeated trot-canter-trot transitions to improve fitness and rideability. Recommended level: Eventing prep.',
    'conditioning',
    'Eventing',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000035'::uuid,
    'system',
    null,
    'Long Rein Hack for Fitness',
    'Light hack on varied terrain at walk and trot on a long rein. Recommended level: Recovery week / all levels.',
    'conditioning',
    null,
    'beginner',
    30
  ),
  (
    'f1430004-0001-4001-8001-000000000036'::uuid,
    'system',
    null,
    'Active Walk Cool-down',
    'Ten minutes of forward walk to gradually lower heart rate after work. Recommended level: All levels.',
    'cooldown',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000037'::uuid,
    'system',
    null,
    'Stretching on Long Rein',
    'Allow the horse to stretch down at walk and trot on a long rein. Recommended level: Post-workout / all levels.',
    'cooldown',
    'Dressage',
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000038'::uuid,
    'system',
    null,
    'Walk-Halt Transitions to Relax',
    'Slow walk-halt-walk transitions to encourage mental relaxation. Recommended level: All levels.',
    'cooldown',
    null,
    'beginner',
    8
  ),
  (
    'f1430004-0001-4001-8001-000000000039'::uuid,
    'system',
    null,
    'Backing Up Slowly',
    'Gentle rein-back steps to release tension through the topline. Recommended level: Recovery day.',
    'cooldown',
    null,
    'beginner',
    8
  ),
  (
    'f1430004-0001-4001-8001-000000000040'::uuid,
    'system',
    null,
    'Lateral Flexion at Standstill',
    'Soft lateral flexion left and right at halt before untacking. Recommended level: All levels.',
    'cooldown',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000041'::uuid,
    'system',
    null,
    'Hand Walk After Hard Work',
    'Hand walk for fifteen minutes after intense jumping or cross-country. Recommended level: Competition day.',
    'cooldown',
    'Eventing',
    'beginner',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000042'::uuid,
    'system',
    null,
    'Loose Rein Arena Walk',
    'One lap each direction on completely loose reins at walk only. Recommended level: Post-lesson / all levels.',
    'cooldown',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000043'::uuid,
    'system',
    null,
    'Figure-Eight Walk Relaxation',
    'Large figure-eight at walk with frequent praise and soft contact. Recommended level: Young horse / novice.',
    'cooldown',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000044'::uuid,
    'system',
    null,
    'Leading with Yield to Pressure',
    'Practice yielding the hindquarters from light halter pressure on the ground. Recommended level: Young horse.',
    'groundwork',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000045'::uuid,
    'system',
    null,
    'Lunging with Transitions',
    'Walk-trot-canter transitions on the lunge with clear voice commands. Recommended level: Novice.',
    'groundwork',
    null,
    'beginner',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000046'::uuid,
    'system',
    null,
    'Ground Tie and Patience',
    'Stand quietly tied for increasing intervals while remaining relaxed. Recommended level: All horses.',
    'groundwork',
    null,
    'beginner',
    10
  ),
  (
    'f1430004-0001-4001-8001-000000000047'::uuid,
    'system',
    null,
    'Desensitization with Tarp',
    'Introduce a tarp on the ground; ask the horse to sniff and step over calmly. Recommended level: Young horse.',
    'groundwork',
    null,
    'beginner',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000048'::uuid,
    'system',
    null,
    'Long Lining Straightness',
    'Drive the horse on long lines focusing on straight tracks and halts. Recommended level: Training level.',
    'groundwork',
    'Dressage',
    'intermediate',
    15
  ),
  (
    'f1430004-0001-4001-8001-000000000049'::uuid,
    'system',
    null,
    'Backing and Hindquarter Yield',
    'Rein-back three steps then yield hindquarters away from handler pressure. Recommended level: Groundwork foundation.',
    'groundwork',
    null,
    'intermediate',
    12
  ),
  (
    'f1430004-0001-4001-8001-000000000050'::uuid,
    'system',
    null,
    'Obstacle Course at Walk',
    'Lead through poles, cones, and a narrow gap to build confidence. Recommended level: Young horse / novice.',
    'groundwork',
    'Eventing',
    'beginner',
    15
  )
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.exercises ENABLE TRIGGER exercises_enforce_source;

-- Verification
SELECT
  category,
  count(*) AS exercise_count
FROM public.exercises
WHERE source = 'system'
  AND id >= 'f1430004-0001-4001-8001-000000000001'::uuid
  AND id <= 'f1430004-0001-4001-8001-000000000050'::uuid
GROUP BY category
ORDER BY category;

SELECT count(*) AS total_library_exercises
FROM public.exercises
WHERE source = 'system'
  AND id >= 'f1430004-0001-4001-8001-000000000001'::uuid
  AND id <= 'f1430004-0001-4001-8001-000000000050'::uuid;
