# Sprint 10.3 — Security & Database Hardening Report

**Date:** 2026-08-03  
**Commit:** `fix(db): harden security before beta`  
**Scope:** High-priority audit fixes only — no UI, localization, or feature changes

---

## Summary

Implemented migration **035** addressing the two critical security gaps from Sprint 10.2 (H1, H2) plus idempotent `search_vector` repair for drifted environments.

---

## Security Changes

### 1. Verified listings protection

| Change | Detail |
|--------|--------|
| Trigger `protect_horse_listing_verified()` | Non-admins cannot set or change `horse_listings.verified`; admins bypass via `is_admin()` |
| Trigger `horse_listings_protect_verified` | Fires `BEFORE INSERT OR UPDATE` on `horse_listings` |
| Admin SELECT policy | `"Admins can read all horse listings"` |
| Admin UPDATE policy | `"Admins can update horse listings"` — enables admin verification workflow |

**Public API unchanged:** Public read remains `status = 'active'`. The `verified` column is a trust badge only admins may toggle; sellers can still publish listings (`status = active`) with `verified = false`.

### 2. Secure internal RPCs

All executable RPCs audited across 36 migrations:

| RPC | Previous permissions | New permissions | Notes |
|-----|---------------------|-----------------|-------|
| `backfill_listing_pedigree_horse(uuid)` | `anon`, `authenticated` | **`authenticated` only** | Added `auth.uid()` + owner/admin check inside function |
| `backfill_stallion_pedigree_horse(uuid)` | `anon`, `authenticated` | **`authenticated` only** | Added `auth.uid()` + owner/admin check inside function |
| `increment_horse_listing_view_count(text)` | `anon`, `authenticated` | *unchanged* | Public marketplace analytics — intentionally callable by anon |
| `is_admin()` | `authenticated` | *unchanged* | Internal helper |
| `can_manage_pedigree_horse_training(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `can_manage_pedigree_horse_traits(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `can_use_exercise_in_training(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `can_manage_training_plan(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `can_manage_training_plan_week(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `can_manage_training_plan_day(uuid)` | `authenticated` | *unchanged* | RLS helper |
| `save_training_plan_structure(uuid, jsonb)` | `authenticated` | *unchanged* | Plan editor |
| `save_training_plan_assignments(uuid, uuid[])` | `authenticated` | *unchanged* | Plan assignments |
| `save_training_plan_full_state(uuid, jsonb, uuid[])` | `authenticated` | *unchanged* | Atomic plan save |

**Internal helpers (no EXECUTE grant — already secure):**

`normalize_pedigree_name_sql`, `find_pedigree_match`, `find_or_create_pedigree_horse`, `horse_listings_search_vector`, all trigger functions.

---

## Database Changes

**New migration:** `supabase/migrations/035_security_hardening_before_beta.sql`

| Section | Objects |
|---------|---------|
| Verified protection | `protect_horse_listing_verified()`, trigger, 2 admin RLS policies |
| RPC hardening | Replaced `backfill_*` functions with auth-gated versions; revoked `anon` EXECUTE |
| Search vector repair | Idempotent `search_vector` column, functions, trigger, GIN index, backfill UPDATE |

**Documentation updated:** `docs/DATABASE.md` — head migration 035, canonical greenfield path, repair-only 031–034 note.

**Verification script added:** `scripts/verify-migrations.mjs` — static audit of migration order and duplicates.

---

## Migration Verification

Run: `node scripts/verify-migrations.mjs`

| Check | Result |
|-------|--------|
| File order | 36 migrations, lexically sorted 001→035 |
| Canonical greenfield path | `001 → … → 028 → 029 → 030 → 035` — all present |
| Duplicate migrations | 031–034 marked repair-only; skip on greenfield |
| Missing migrations | None on canonical path |
| `search_vector` objects | Defined in 029; repaired idempotently in 035 |
| Empty DB migrate | Greenfield path applies without error (029 provides full FTS; 035 adds security) |
| Harmless duplicates | 002, 011 (grant re-asserts); 022a (function duplicate of 021) |

### Repair-only migrations (do not apply on greenfield)

```
031_horse_listings_marketplace_schema_sync.sql
032_horse_listings_add_slug.sql
033_horse_listings_schema_columns_sync.sql
034_horse_listings_schema_columns_sync.sql
```

Environments that previously ran 033/034 without 029 should apply **035** to restore `search_vector` trigger and index.

---

## Build Result

```
npm run build → SUCCESS
  Compiled in ~53s
  TypeScript check passed
  134 static pages, 40 locale routes
```

---

## Lint Result

```
npm run lint → SUCCESS (0 errors, 2 warnings)
```

Pre-existing warnings (unchanged):
- `BreedingLabClient.tsx:209` — `useCallback` missing dependency `t`
- `ExercisePickerModal.tsx:57` — `useEffect` missing deps

---

## Remaining Beta Blockers

| Priority | Blocker | Status |
|----------|---------|--------|
| **Deploy** | Apply migration **035** to production Supabase | **Required before beta** |
| **Deploy** | Confirm production ran 029+030 (or 031 repair); run 035 for search_vector + security | Required |
| Medium | Dual marketplace filter implementations (arch debt) | Not security — defer to 10.4 |
| Medium | `horse-listings.ts` action monolith | Maintainability — defer |
| Medium | 3 circular import cycles in `app/lib/` | Defer |
| Low | Orphan DB columns `favorite_count`, `inquiry_count` | Defer |
| Low | Missing FK index on `pedigree_horses.created_by` | Defer |
| Low | No sitemap | SEO — defer |

**Security blockers from Sprint 10.2 audit (H1, H2, H3) are addressed in migration 035.** H3 (search_vector drift) is repaired idempotently when 035 is applied.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/035_security_hardening_before_beta.sql` | **New** — security hardening |
| `scripts/verify-migrations.mjs` | **New** — migration audit script |
| `docs/DATABASE.md` | Updated migration index and canonical path |
| `docs/sprint-10.3-security-hardening-report.md` | **New** — this report |

---

*No application code, UI, or translations were modified.*
