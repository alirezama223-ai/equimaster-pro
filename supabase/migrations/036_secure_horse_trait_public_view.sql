-- EquiMaster Pro: secure public trait evidence surface
-- Run manually in Supabase Dashboard after migrations 001–035.
--
-- Public horse trait profiles must only expose verified evidence.
-- Demo/Test Mode uses admin-verified synthetic evidence, so it remains visible
-- without exposing unverified owner/breeder submissions.

create or replace view public.horse_trait_assessments_public
with (security_invoker = false)
as
select
  id,
  pedigree_horse_id,
  trait_key,
  score,
  confidence,
  source_type,
  verified,
  created_at,
  updated_at
from public.horse_trait_assessments
where verified = true;

grant select on public.horse_trait_assessments_public to anon, authenticated;

notify pgrst, 'reload schema';
