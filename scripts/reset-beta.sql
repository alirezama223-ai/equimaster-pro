-- =============================================================================
-- EquiMaster Pro — RC1.1 Beta Reset Tool
-- File: scripts/reset-beta.sql
-- =============================================================================
--
-- SAFETY — READ BEFORE RUNNING
-- ----------------------------
-- 1. This script DELETES user-generated beta data from public tables.
-- 2. It does NOT delete auth.users, storage objects, or admin profiles.
-- 3. Run against STAGING first. Take a Supabase backup before production use.
-- 4. Default ending is ROLLBACK (dry-run). Change to COMMIT only after review.
-- 5. Requires SQL Editor / service-role or sufficient DELETE privileges.
-- 6. VACUUM ANALYZE is intentionally NOT included (run separately if needed).
-- 7. See docs/reset-beta.md for full documentation.
--
-- PRESERVED (not deleted)
-- ----------------------------
--   profiles              — all rows (admin + user roles kept)
--   demo_organizations    — migration-seeded demo stable metadata
--   demo_organization_members — migration-seeded demo personas
--   pedigree_horses       — entire pedigree graph (listings/stallions unlinked)
--   exercises             — rows WHERE source = 'system' only
--
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PRE-FLIGHT: Abort if no admin profile exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) THEN
    RAISE EXCEPTION
      'SAFETY CHECK FAILED: No admin profile found in public.profiles. Aborting reset.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PRE-FLIGHT: Row counts before delete (for operator review)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '=== PRE-RESET ROW COUNTS ===';
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('inquiry_messages',        (SELECT count(*) FROM public.inquiry_messages)),
        ('inquiries',               (SELECT count(*) FROM public.inquiries)),
        ('favorites',               (SELECT count(*) FROM public.favorites)),
        ('training_session_exercises', (SELECT count(*) FROM public.training_session_exercises)),
        ('training_sessions',       (SELECT count(*) FROM public.training_sessions)),
        ('training_plan_exercises', (SELECT count(*) FROM public.training_plan_exercises)),
        ('training_plan_days',      (SELECT count(*) FROM public.training_plan_days)),
        ('training_plan_weeks',     (SELECT count(*) FROM public.training_plan_weeks)),
        ('training_plan_assignments', (SELECT count(*) FROM public.training_plan_assignments)),
        ('training_plans',          (SELECT count(*) FROM public.training_plans)),
        ('horse_health_checks',     (SELECT count(*) FROM public.horse_health_checks)),
        ('horse_injuries',          (SELECT count(*) FROM public.horse_injuries)),
        ('horse_farrier_visits',    (SELECT count(*) FROM public.horse_farrier_visits)),
        ('horse_vet_visits',        (SELECT count(*) FROM public.horse_vet_visits)),
        ('horse_vaccinations',      (SELECT count(*) FROM public.horse_vaccinations)),
        ('horse_medications',       (SELECT count(*) FROM public.horse_medications)),
        ('horse_events',            (SELECT count(*) FROM public.horse_events)),
        ('horse_trait_assessments', (SELECT count(*) FROM public.horse_trait_assessments)),
        ('mare_breeding_goals',     (SELECT count(*) FROM public.mare_breeding_goals)),
        ('breeding_analyses',       (SELECT count(*) FROM public.breeding_analyses)),
        ('horse_listings',          (SELECT count(*) FROM public.horse_listings)),
        ('stallions',               (SELECT count(*) FROM public.stallions)),
        ('breeders',                (SELECT count(*) FROM public.breeders)),
        ('demo_user_state',         (SELECT count(*) FROM public.demo_user_state)),
        ('exercises (user)',        (SELECT count(*) FROM public.exercises WHERE source = 'user')),
        ('exercises (system)',      (SELECT count(*) FROM public.exercises WHERE source = 'system')),
        ('profiles',                (SELECT count(*) FROM public.profiles)),
        ('profiles (admin)',        (SELECT count(*) FROM public.profiles WHERE role = 'admin')),
        ('pedigree_horses',         (SELECT count(*) FROM public.pedigree_horses)),
        ('demo_organizations',      (SELECT count(*) FROM public.demo_organizations)),
        ('demo_organization_members', (SELECT count(*) FROM public.demo_organization_members))
    ) AS t(table_name, row_count)
  LOOP
    RAISE NOTICE '% : %', rpad(r.table_name, 28), r.row_count;
  END LOOP;
END $$;

-- =============================================================================
-- SECTION 1: Marketplace messaging
-- FK: inquiry_messages → inquiries → horse_listings
-- =============================================================================

-- Delete inquiry thread messages first (child of inquiries)
DELETE FROM public.inquiry_messages;

-- Delete buyer/seller inquiries on listings
DELETE FROM public.inquiries;

-- =============================================================================
-- SECTION 2: Marketplace engagement
-- FK: favorites → horse_listings, auth.users
-- =============================================================================

-- Delete user saved listing bookmarks
DELETE FROM public.favorites;

-- =============================================================================
-- SECTION 3: Training sessions
-- FK: training_session_exercises → training_sessions (CASCADE)
--     training_session_exercises → exercises (RESTRICT — must delete before user exercises)
--     training_sessions → pedigree_horses (pedigree rows preserved)
-- =============================================================================

-- Delete per-session exercise rows (references sessions + exercises)
DELETE FROM public.training_session_exercises;

-- Delete logged training sessions
DELETE FROM public.training_sessions;

-- =============================================================================
-- SECTION 4: Training plan structure
-- FK: plan_exercises → plan_days → plan_weeks → training_plans (CASCADE chain)
--     plan_exercises → exercises (RESTRICT)
--     training_plan_assignments → training_plans + pedigree_horses
-- =============================================================================

-- Delete plan day exercise slots (references days + exercises)
DELETE FROM public.training_plan_exercises;

-- Delete plan days (child of weeks)
DELETE FROM public.training_plan_days;

-- Delete plan weeks (child of plans)
DELETE FROM public.training_plan_weeks;

-- Delete plan-to-horse assignments
DELETE FROM public.training_plan_assignments;

-- Delete reusable training plan templates
DELETE FROM public.training_plans;

-- =============================================================================
-- SECTION 5: Horse health records
-- FK: all health tables → pedigree_horses (CASCADE on horse delete; we keep pedigree)
-- =============================================================================

DELETE FROM public.horse_health_checks;
DELETE FROM public.horse_injuries;
DELETE FROM public.horse_farrier_visits;
DELETE FROM public.horse_vet_visits;
DELETE FROM public.horse_vaccinations;
DELETE FROM public.horse_medications;

-- =============================================================================
-- SECTION 6: Horse timeline & breeding intelligence
-- FK: horse_events, trait_assessments, mare_breeding_goals, breeding_analyses
--     → pedigree_horses (pedigree rows preserved)
-- =============================================================================

-- Delete horse timeline / event log entries
DELETE FROM public.horse_events;

-- Delete trait evidence submissions
DELETE FROM public.horse_trait_assessments;

-- Delete private mare breeding goal settings
DELETE FROM public.mare_breeding_goals;

-- Delete Breeding Lab analysis runs
DELETE FROM public.breeding_analyses;

-- =============================================================================
-- SECTION 7: Marketplace & directory entities
-- FK: horse_listings.pedigree_horse_id → pedigree_horses (SET NULL on horse delete)
--     stallions → breeders (CASCADE)
--     listings/stallions unlink from pedigree; pedigree_horses rows are kept
-- =============================================================================

-- Delete all horse marketplace listings
DELETE FROM public.horse_listings;

-- Delete stallion directory entries (must precede breeders)
DELETE FROM public.stallions;

-- Delete breeder / stud farm profiles
DELETE FROM public.breeders;

-- =============================================================================
-- SECTION 8: Demo user tracking state
-- PRESERVED: demo_organizations, demo_organization_members (reference metadata)
-- =============================================================================

-- Reset per-user demo mode flags and seeded entity ID tracking
DELETE FROM public.demo_user_state;

-- =============================================================================
-- SECTION 9: User-created exercises only
-- PRESERVED: exercises WHERE source = 'system' (catalog seed — never delete)
-- FK: plan/session exercise rows already removed above (RESTRICT satisfied)
-- =============================================================================

-- Delete custom user exercises; system catalog rows are untouched
DELETE FROM public.exercises
WHERE source = 'user';

-- =============================================================================
-- POST-RESET: Verification counts (expect 0 on cleared tables)
-- =============================================================================
DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '=== POST-RESET ROW COUNTS (cleared tables should be 0) ===';
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('inquiry_messages',        (SELECT count(*) FROM public.inquiry_messages)),
        ('inquiries',               (SELECT count(*) FROM public.inquiries)),
        ('favorites',               (SELECT count(*) FROM public.favorites)),
        ('training_session_exercises', (SELECT count(*) FROM public.training_session_exercises)),
        ('training_sessions',       (SELECT count(*) FROM public.training_sessions)),
        ('training_plan_exercises', (SELECT count(*) FROM public.training_plan_exercises)),
        ('training_plan_days',      (SELECT count(*) FROM public.training_plan_days)),
        ('training_plan_weeks',     (SELECT count(*) FROM public.training_plan_weeks)),
        ('training_plan_assignments', (SELECT count(*) FROM public.training_plan_assignments)),
        ('training_plans',          (SELECT count(*) FROM public.training_plans)),
        ('horse_health_checks',     (SELECT count(*) FROM public.horse_health_checks)),
        ('horse_injuries',          (SELECT count(*) FROM public.horse_injuries)),
        ('horse_farrier_visits',    (SELECT count(*) FROM public.horse_farrier_visits)),
        ('horse_vet_visits',        (SELECT count(*) FROM public.horse_vet_visits)),
        ('horse_vaccinations',      (SELECT count(*) FROM public.horse_vaccinations)),
        ('horse_medications',       (SELECT count(*) FROM public.horse_medications)),
        ('horse_events',            (SELECT count(*) FROM public.horse_events)),
        ('horse_trait_assessments', (SELECT count(*) FROM public.horse_trait_assessments)),
        ('mare_breeding_goals',     (SELECT count(*) FROM public.mare_breeding_goals)),
        ('breeding_analyses',       (SELECT count(*) FROM public.breeding_analyses)),
        ('horse_listings',          (SELECT count(*) FROM public.horse_listings)),
        ('stallions',               (SELECT count(*) FROM public.stallions)),
        ('breeders',                (SELECT count(*) FROM public.breeders)),
        ('demo_user_state',         (SELECT count(*) FROM public.demo_user_state)),
        ('exercises (user)',        (SELECT count(*) FROM public.exercises WHERE source = 'user')),
        ('exercises (system)',      (SELECT count(*) FROM public.exercises WHERE source = 'system')),
        ('profiles',                (SELECT count(*) FROM public.profiles)),
        ('profiles (admin)',        (SELECT count(*) FROM public.profiles WHERE role = 'admin')),
        ('pedigree_horses',         (SELECT count(*) FROM public.pedigree_horses)),
        ('demo_organizations',      (SELECT count(*) FROM public.demo_organizations)),
        ('demo_organization_members', (SELECT count(*) FROM public.demo_organization_members))
    ) AS t(table_name, row_count)
  LOOP
    RAISE NOTICE '% : %', rpad(r.table_name, 28), r.row_count;
  END LOOP;
END $$;

-- =============================================================================
-- TRANSACTION END
-- =============================================================================
--
-- SAFETY: Default is ROLLBACK so accidental execution does not persist changes.
-- After reviewing PRE/POST counts in the SQL Editor messages panel:
--   1. Comment out ROLLBACK below
--   2. Uncomment COMMIT
--   3. Re-run the transaction end (or re-run full script)
--
ROLLBACK;
-- COMMIT;

-- VACUUM ANALYZE is intentionally NOT included.
-- Run manually after COMMIT if the database is large:
--   VACUUM ANALYZE;
