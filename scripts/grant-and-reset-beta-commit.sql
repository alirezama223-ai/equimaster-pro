-- Grant service_role access (required for sb_secret REST; safe to re-run)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- reset-beta.sql body with COMMIT (includes pedigree_horses delete per user request)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: No admin profile found.';
  END IF;
END $$;

DELETE FROM public.inquiry_messages;
DELETE FROM public.inquiries;
DELETE FROM public.favorites;
DELETE FROM public.training_session_exercises;
DELETE FROM public.training_sessions;
DELETE FROM public.training_plan_exercises;
DELETE FROM public.training_plan_days;
DELETE FROM public.training_plan_weeks;
DELETE FROM public.training_plan_assignments;
DELETE FROM public.training_plans;
DELETE FROM public.horse_health_checks;
DELETE FROM public.horse_injuries;
DELETE FROM public.horse_farrier_visits;
DELETE FROM public.horse_vet_visits;
DELETE FROM public.horse_vaccinations;
DELETE FROM public.horse_medications;
DELETE FROM public.horse_events;
DELETE FROM public.horse_trait_assessments;
DELETE FROM public.mare_breeding_goals;
DELETE FROM public.breeding_analyses;
DELETE FROM public.horse_listings;
DELETE FROM public.stallions;
DELETE FROM public.breeders;
DELETE FROM public.demo_user_state;
DELETE FROM public.exercises WHERE source = 'user';
DELETE FROM public.pedigree_horses;

COMMIT;

-- Verification
SELECT
  (SELECT COUNT(*) FROM horse_listings) AS horse_listings,
  (SELECT COUNT(*) FROM breeders) AS breeders,
  (SELECT COUNT(*) FROM stallions) AS stallions,
  (SELECT COUNT(*) FROM inquiries) AS inquiries,
  (SELECT COUNT(*) FROM favorites) AS favorites,
  (SELECT COUNT(*) FROM breeding_analyses) AS breeding_analyses,
  (SELECT COUNT(*) FROM training_sessions) AS training_sessions,
  (SELECT COUNT(*) FROM pedigree_horses) AS pedigree_horses;
