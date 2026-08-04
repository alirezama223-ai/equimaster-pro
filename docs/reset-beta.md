# Beta Reset Tool (RC1.1)

**Script:** `scripts/reset-beta.sql`  
**Purpose:** Clear user-generated beta data before a clean beta launch while preserving platform reference data and admin access.

> **This document describes the reset tool only. Nothing is executed automatically.**

---

## What is deleted

The script removes all rows from these **24 public tables** (full table clear except where noted):

| Section | Tables |
|---------|--------|
| Marketplace messaging | `inquiry_messages`, `inquiries` |
| Marketplace engagement | `favorites` |
| Training sessions | `training_session_exercises`, `training_sessions` |
| Training plans | `training_plan_exercises`, `training_plan_days`, `training_plan_weeks`, `training_plan_assignments`, `training_plans` |
| Horse health | `horse_health_checks`, `horse_injuries`, `horse_farrier_visits`, `horse_vet_visits`, `horse_vaccinations`, `horse_medications` |
| Breeding & traits | `horse_events`, `horse_trait_assessments`, `mare_breeding_goals`, `breeding_analyses` |
| Directory & listings | `horse_listings`, `stallions`, `breeders` |
| Demo tracking | `demo_user_state` |
| Custom exercises | `exercises` **WHERE `source = 'user'`** only |

### Delete order (FK-safe)

1. `inquiry_messages` → `inquiries`
2. `favorites`
3. `training_session_exercises` → `training_sessions`
4. `training_plan_exercises` → `training_plan_days` → `training_plan_weeks` → `training_plan_assignments` → `training_plans`
5. All six `horse_*` health tables
6. `horse_events`, `horse_trait_assessments`, `mare_breeding_goals`, `breeding_analyses`
7. `horse_listings` → `stallions` → `breeders`
8. `demo_user_state`
9. `exercises WHERE source = 'user'` (after session/plan exercise rows are gone)

Order respects `ON DELETE RESTRICT` on `exercises` from plan/session junction tables.

---

## What is preserved

| Object | Why preserved |
|--------|---------------|
| **`profiles`** (all rows) | Admin RBAC via `is_admin()`; user rows are harmless and tied to `auth.users` |
| **`demo_organizations`** | Migration-seeded demo stable metadata (fixed UUID) |
| **`demo_organization_members`** | Migration-seeded demo personas |
| **`pedigree_horses`** (all rows) | Shared pedigree graph; listings/stallions are removed but pedigree nodes remain |
| **`exercises` WHERE `source = 'system'`** | 50-item catalog seed (`supabase/seeds/exercise_library_seed.sql`) |

### Not covered by this SQL script

These are **outside** `public` table scope — clear manually if needed:

| Scope | Action |
|-------|--------|
| **`auth.users`** | Test accounts remain unless deleted separately in Supabase Auth |
| **Storage buckets** | `horse-images`, `horse-videos`, `stallion-images`, `breeder-images` — use `scripts/clear-storage.mjs` |
| **Public views** | `horse_training_summary`, `horse_trait_assessments_public` — derived; no delete needed |

### Expected side effects

- **`pedigree_horses`** may contain orphan nodes after listings/stallions are removed (`pedigree_horse_id` on listings/stallions becomes irrelevant once parent rows are gone).
- **Admin accounts** survive the pre-flight check and are never deleted.

---

## Safety features in the script

1. **Wrapped in `BEGIN` … `ROLLBACK`/`COMMIT`** — single transaction.
2. **Pre-flight admin check** — aborts if no `profiles.role = 'admin'` row exists.
3. **Pre- and post-reset row counts** — logged via `RAISE NOTICE` for operator review.
4. **Default `ROLLBACK`** — accidental full-script run does **not** persist changes until you explicitly switch to `COMMIT`.
5. **Commented sections** — each delete group documents FK rationale.
6. **No `VACUUM ANALYZE`** — run separately after commit if needed.

---

## How to execute safely

### 1. Prepare

- [ ] Confirm target environment (**staging first**, never production first).
- [ ] Take a Supabase **backup** (Dashboard → Database → Backups) or project snapshot.
- [ ] Verify at least one admin exists:  
  `SELECT user_id, role FROM public.profiles WHERE role = 'admin';`
- [ ] Confirm system exercises exist:  
  `SELECT count(*) FROM public.exercises WHERE source = 'system';`  
  (Re-run `supabase/seeds/exercise_library_seed.sql` if count is 0.)

### 2. Dry run (recommended)

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste contents of `scripts/reset-beta.sql`.
3. Run the script with default **`ROLLBACK`** at the bottom.
4. Review **PRE-RESET** and **POST-RESET** counts in the Messages panel.
5. Confirm cleared tables show `0` in post-reset counts.
6. Confirm preserved tables (`profiles (admin)`, `exercises (system)`, `pedigree_horses`, `demo_*`) show expected non-zero counts.

### 3. Apply for real

1. Edit the end of the script:
   ```sql
   -- ROLLBACK;
   COMMIT;
   ```
2. Re-run the full script (or run `COMMIT;` if the transaction is still open — prefer re-running the full script in a fresh session).
3. Optionally clear **Storage** objects for deleted listings/media:
   ```bash
   node scripts/clear-storage.mjs              # preview counts
   node scripts/clear-storage.mjs --confirm    # delete all bucket objects
   ```
   Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see script header).
4. Optionally remove test **`auth.users`** accounts via Supabase Auth dashboard.
5. Optionally run `VACUUM ANALYZE;` after commit on large databases.

### 4. Post-reset verification

```sql
-- Cleared tables should return 0
SELECT 'horse_listings' AS t, count(*) FROM public.horse_listings
UNION ALL SELECT 'breeders', count(*) FROM public.breeders
UNION ALL SELECT 'stallions', count(*) FROM public.stallions;

-- Preserved tables should remain
SELECT 'admin_profiles' AS t, count(*) FROM public.profiles WHERE role = 'admin'
UNION ALL SELECT 'system_exercises', count(*) FROM public.exercises WHERE source = 'system'
UNION ALL SELECT 'pedigree_horses', count(*) FROM public.pedigree_horses
UNION ALL SELECT 'demo_orgs', count(*) FROM public.demo_organizations;
```

---

## When not to use this script

- You need to remove **admin** or **auth** accounts → handle via Supabase Auth manually.
- You need to wipe **pedigree data** → not supported; requires a separate script with manual review.
- You need to reset **system exercises** → re-seed from `supabase/seeds/exercise_library_seed.sql` instead of deleting.
- Production has **real user data** you intend to keep → do not run this script.

---

## Related files

| File | Purpose |
|------|---------|
| `scripts/reset-beta.sql` | Transactional reset script |
| `scripts/clear-storage.mjs` | Preview/delete all Storage bucket objects |
| `supabase/seeds/exercise_library_seed.sql` | System exercise catalog (re-seed if missing) |
| `supabase/migrations/028_demo_infrastructure.sql` | Demo org seed source |
