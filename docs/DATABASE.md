# EquiMaster Pro — Database

PostgreSQL schema managed via manual migrations in `supabase/migrations/`. Apply in numeric order in the Supabase SQL Editor.

**Current head: 027**

## Migration index

| # | File | Purpose |
|---|------|---------|
| 001 | `001_horse_listings.sql` | Core marketplace listings |
| 002 | `002_horse_listings_grants.sql` | Listing table grants |
| 003 | `003_horse_images_storage.sql` | Listing image storage bucket/policies |
| 004 | `004_horse_videos_storage.sql` | Listing video storage |
| 005 | `005_favorites.sql` | User favorites |
| 006 | `006_inquiries.sql` | Buyer inquiries on listings |
| 007 | `007_inquiries_buyer_select.sql` | Inquiry RLS fix |
| 008 | `008_inquiry_messages.sql` | Inquiry message threads |
| 009 | `009_breeders_stallions.sql` | Breeders and stallions |
| 010 | `010_stallion_breeder_storage.sql` | Breeder/stallion image storage |
| 011 | `011_breeders_stallions_grants.sql` | Grants |
| 012 | `012_stallions_update_rls.sql` | Stallion update policies |
| 013 | `013_stallions_delete_rls.sql` | Stallion delete policies |
| 014 | `014_profiles_admin_verification.sql` | Profiles, admin role, verification |
| 015 | `015_pedigree_horses.sql` | Pedigree graph horses |
| 016 | `016_breeding_analyses.sql` | Saved breeding analyses |
| 017 | `017_pedigree_listing_backfill.sql` | Link listings to pedigree |
| 018 | `018_breeding_recommendations_indexes.sql` | Recommendation query indexes |
| 019 | `019_horse_traits_breeding_goals.sql` | Trait assessments, breeding goals |
| 020 | `020_daily_training_foundation.sql` | Exercises, plans, sessions, RLS gate |
| 021 | `021_training_plan_structure.sql` | Plan weeks/days/exercises |
| 022 | `022_training_plan_persistence.sql` | Plan editor persistence |
| 022a | `022a_can_manage_training_plan.sql` | Plan ownership function |
| 023 | `023_training_plan_assignments.sql` | Horse ↔ plan assignments |
| 024 | `024_session_tracking.sql` | Session exercise status, reflection fields |
| 025 | `025_horse_training_summary.sql` | Analytics view |
| 026 | `026_horse_health_module.sql` | Health & wellness tables |
| 027 | `027_horse_events.sql` | Central event bus |

## Entity relationship (core)

```
auth.users
    │
    ├── horse_listings ──► pedigree_horses ◄── stallions
    │                           │
    ├── breeders                ├── horse_trait_assessments
    │                           ├── training_sessions ──► training_session_exercises
    ├── favorites               ├── horse_health_* (6 tables)
    ├── training_plans          ├── horse_events
    ├── profiles                └── breeding_analyses
    └── inquiries / inquiry_messages
```

## Key tables

### `pedigree_horses`

Canonical horse identity for pedigree, training, health, traits, and events.

| Column | Notes |
|--------|-------|
| `id` | UUID PK — used as `pedigree_horse_id` / `horse_id` in domain tables |
| `name`, `normalized_name` | Display + search |
| `created_by` | Original creator |

### `horse_listings`

Marketplace listings. Optional `pedigree_horse_id` links to pedigree graph.

### Training (020–024)

| Table | Purpose |
|-------|---------|
| `exercises` | System + user exercise catalog |
| `training_plans` | Reusable plan templates |
| `training_plan_weeks/days/exercises` | Structured plan editor (021) |
| `training_plan_assignments` | Active plan per horse (023) |
| `training_sessions` | Daily log per horse |
| `training_session_exercises` | Exercises within a session |

**Ownership gate**: `can_manage_pedigree_horse_training(pedigree_horse_id)` — same relationships as trait management.

### Analytics view (025)

`horse_training_summary` — per-user, per-horse aggregates:

- Total/completed sessions, completion rate
- Average rating, duration, training streak
- Last session date/id

Filtered by `created_by = auth.uid()` in queries.

### Health (026)

| Table | Purpose |
|-------|---------|
| `horse_health_checks` | Daily wellness (unique per user/horse/date) |
| `horse_injuries` | Injury tracking with status |
| `horse_farrier_visits` | Farrier schedule |
| `horse_vet_visits` | Vet records |
| `horse_vaccinations` | Vaccination + due dates |
| `horse_medications` | Active/historical medications |

### Events (027)

`horse_events` — central event log:

| Column | Type | Notes |
|--------|------|-------|
| `horse_id` | UUID FK | → `pedigree_horses.id` |
| `event_type` | text | e.g. `HIGH_WORKLOAD`, `SESSION_COMPLETED` |
| `severity` | text | `info`, `watch`, `alert`, `positive` |
| `title` | text | Short headline |
| `description` | text | Detail + recommendation |
| `source_module` | text | `training`, `health`, `analytics`, `rule_engine` |
| `dedupe_key` | text | Idempotent sync key |
| `resolved` | boolean | User or sync can resolve |
| `created_at` | timestamptz | Event timestamp |

**Partial unique index**: `(created_by, horse_id, source_module, dedupe_key) WHERE resolved = false`

### Traits (019)

| Table | Purpose |
|-------|---------|
| `horse_trait_assessments` | Scored trait evidence |
| `mare_breeding_goals` | Private mare goal profiles |

Public reads use view `horse_trait_assessments_public` (no `created_by` / `source_note`).

## RLS patterns

All user-data tables follow:

1. `created_by = auth.uid()` (or `user_id = auth.uid()`) for CRUD
2. Ownership gate on insert/update where tied to a horse
3. Admin override via `is_admin()` policies
4. `revoke all from anon; grant … to authenticated`

## Storage buckets

| Migration | Bucket | Purpose |
|-----------|--------|---------|
| 003 | horse images | Listing photos |
| 004 | horse videos | Listing videos |
| 010 | breeder/stallion | Stud farm media |

## SQL functions (selected)

| Function | Migration | Purpose |
|----------|-----------|---------|
| `can_manage_pedigree_horse_training(uuid)` | 020 | Training/health/events ownership |
| `can_manage_training_plan(uuid)` | 022a | Plan edit access |
| `can_use_exercise_in_training(uuid)` | 020 | Exercise catalog access |
| `is_admin()` | 014 | Admin role check |

## RC1 migration checklist

Apply in order if not already done:

- [ ] 020 — Training foundation (required for `/training`)
- [ ] 021–023 — Training plans
- [ ] 024 — Session tracking (live session workflow)
- [ ] 025 — Analytics view
- [ ] 026 — Health module
- [ ] 027 — Event engine

Code degrades gracefully with user-facing messages when migrations are missing.

## Query conventions

- Horse-scoped queries filter `created_by = userId` **and** `pedigree_horse_id` / `horse_id`
- Dashboard lib functions use `Promise.all` for independent reads
- Event sync uses dedupe keys — never insert duplicate active events
- Analytics summary reads from `horse_training_summary` view (not ad-hoc aggregation in app)
