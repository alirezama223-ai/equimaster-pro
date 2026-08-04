# Sprint 10.2 — Database & Architecture Audit Report

**Date:** 2026-08-03  
**Scope:** Read-only audit — no code, migrations, or translation changes  
**Repository:** `equimaster-pro` @ `main` (`ce8f2b2`)

---

## Scores

| Area | Score | Summary |
|------|------:|---------|
| **Database** | **72 / 100** | Solid RLS and FK coverage across core domains; migration redundancy and two security gaps block a higher score |
| **Architecture** | **74 / 100** | Coherent App Router + i18n + server-actions layout; duplication and circular imports are the main drag |
| **Combined readiness** | **73 / 100** | Beta-viable with targeted fixes below |

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass — 0 errors, 2 warnings |
| `npm run build` | Pass — 40 locale routes, 134 static pages |
| App Router structure | All pages under `app/[locale]/`; auth callback at `app/auth/callback/route.ts` |
| i18n architecture | 5 locales × 23 namespaces; `next-intl` plugin + proxy routing |
| Supabase client usage | Server (`createClient`), browser (`createBrowserClient`), proxy session — consistent |
| Environment variables | `.env.local.example` matches all referenced vars (3 public keys + `NODE_ENV`) |
| API boundaries | 19 server action modules; 1 route handler (auth callback); no `app/api/**` |

---

## 1. Database Audit

### 1.1 Migration inventory

**35 migrations** in `supabase/migrations/` (001–034 + `022a`), plus optional script `scripts/021-section-b-permissions.sql`.

| Range | Domain | Tables / features |
|-------|--------|-------------------|
| 001–008 | Marketplace core | `horse_listings`, storage buckets, `favorites`, `inquiries`, `inquiry_messages` |
| 009–014 | Breeders / stallions / admin | `breeders`, `stallions`, `profiles`, verification triggers |
| 015–019 | Pedigree / breeding | `pedigree_horses`, `breeding_analyses`, traits, breeding goals |
| 020–025 | Training | Plans, sessions, exercises, assignments, session tracking, summary view |
| 026–027 | Health / events | 6 health tables, `horse_events` |
| 028 | Demo | `demo_organizations`, `demo_organization_members`, `demo_user_state` |
| 029–034 | Marketplace v2 | Slug, search vector, view counts, schema sync repairs |

**Recommended canonical chain for fresh installs:** `001 → … → 028 → 029 → 030`

### 1.2 Duplicate / obsolete migrations

| Migration | Verdict |
|-----------|---------|
| **029 + 030** | **Canonical** — slug, `search_vector`, GIN index, view count, public summaries |
| **031** | Repair rollup of 029+030 — useful for fixing drift; redundant on greenfield |
| **032** | Strict subset of 031 (slug only) — **obsolete** if 029/031 applied |
| **033** | Adds columns without backfill or `search_vector`; introduces orphan `favorite_count` / `inquiry_count` — **divergent** |
| **034** | Safer idempotent version of 033 — **redundant with 033**; app error messages reference this file |
| **002, 011** | Re-assert GRANTs already in 001 / 009 — harmless duplicates |
| **022a** | Duplicate of `can_manage_training_plan` from 021 — harmless if idempotent |

**Risk:** Environments that ran 033/034 without 029/031 may lack `search_vector` and have unused counter columns.

### 1.3 Foreign keys

All major relationships are defined. Notable FK columns **without dedicated indexes:**

| Table | Column | Risk |
|-------|--------|------|
| `pedigree_horses` | `created_by` | Used in RLS helpers and training permission checks |
| `breeders` | `owner_id` | Only partial index (`WHERE status = 'active'`) — draft/archived lookups may seq-scan |

All other frequently queried FK columns have dedicated or composite indexes.

### 1.4 Indexes

**Strengths:**
- Marketplace partial indexes on `horse_listings` (status, breed, discipline, country, etc.)
- GIN index on `search_vector` (029/031)
- Training session/plan composite indexes
- Health and events tables indexed on `pedigree_horse_id` + `created_by`

**Gaps:**
- Missing FK indexes listed above
- `favorite_count` / `inquiry_count` indexed in 033/034 but never maintained by triggers

### 1.5 Constraints

| Issue | Severity | Detail |
|-------|----------|--------|
| Slug uniqueness drift | Medium | 029 enforces NOT NULL + unique; 034 uses partial unique `WHERE slug IS NOT NULL` |
| `view_count` nullability | Medium | NOT NULL in 030; nullable in 033/034 |
| Counter columns | Low | `favorite_count`, `inquiry_count` — no `>= 0` check, no maintenance logic |
| Price vs `price_on_request` | Low | No DB constraint enforcing price when not on request |
| Sex enum mismatch | Low | Listings use title case (`Mare`); pedigree uses lowercase — app maps in backfill |

### 1.6 RLS policies

**Strengths:**
- Owner-scoped CRUD on listings, favorites, inquiries, training, health
- Admin verification triggers on breeders, stallions, pedigree (`014`)
- Training gated by `can_manage_pedigree_horse_training`
- Inquiry messages restricted to conversation participants

**Gaps:**

| Issue | Severity | Location |
|-------|----------|----------|
| `horse_listings.verified` unprotected | **High** | Owners can UPDATE own row and set `verified = true`; no admin policy or trigger (unlike breeders/stallions) |
| Backfill RPCs granted to `anon` | **High** | `017` L351–352 — `SECURITY DEFINER` functions callable without auth |
| Open pedigree read | Medium | `015` — `USING (true)` for all roles including anon |
| No admin listing verification policy | Medium | Admin can verify breeders/stallions but not listings |
| View count RPC open to anon | Low | `030` — intentional for public analytics |

### 1.7 Unused tables

**None.** Every table created in migrations has at least one `.from("…")` call in `app/`.

Views `horse_trait_assessments_public` and `horse_training_summary` are actively used.

### 1.8 Unused columns

| Column | Migration | App usage |
|--------|-----------|-----------|
| `horse_listings.favorite_count` | 033, 034 | **None** |
| `horse_listings.inquiry_count` | 033, 034 | **None** |
| `breeders.slug` | 009 | Type definition only; never read/written |
| `pedigree_horses.external_reference` | 015 | Mapped in lib; always null in practice |

---

## 2. Architecture Audit

### 2.1 Duplicated business logic

| Area | Files | Issue |
|------|-------|-------|
| Marketplace filtering | `app/lib/horse-filters.ts` (client/home) vs `app/lib/marketplace/search.ts` (server/browse) | Two parallel filter/sort implementations with different option sets |
| Error helpers | `withDevError` copy-pasted in 5 action files | Same dev-debug append logic |
| Image storage | `horse-image-storage.ts`, `stallion-image-storage.ts`, `breeder-image-storage.ts`, `horse-video-storage.ts` | Near-identical sanitize/path/validate helpers |
| Price formatting | `horse-listings.ts`, `listing-validation.ts` | Same output, different input types |
| Score/severity helpers | `training/rules/helpers.ts`, `health/rules/helpers.ts`, `events/format.ts` | Identical clamping and severity thresholds |

**Healthy patterns:** Training, marketplace search, breeding, and events modules delegate well from actions → lib.

### 2.2 Duplicated API routes

**None.** Single route handler (`app/auth/callback/route.ts`). All data access via 19 server action modules. No `app/api/**` directory.

### 2.3 Duplicated React components

| Pattern | Detail |
|---------|--------|
| `PedigreeSection` name collision | `components/pedigree/PedigreeSection.tsx` (display) vs `components/sell/PedigreeSection.tsx` (form) |
| Browse/filter UI overlap | `AdvancedSearch` (home), `MarketplaceBrowseClient` (/horses), `MarketplaceHomeClient` (/marketplace) |
| View/Client wrappers | Intentional pattern: `BreederCardView` + `BreederCardClient`, `PedigreeHorseCardView` + `PedigreeHorseCardClient` |
| Training state barrels | `TrainingEmptyState` / `TrainingErrorState` re-export `shared/EmptyState` / `ErrorState` |

### 2.4 Circular imports

**3 cycles in `app/lib/`** (none in components):

1. `marketplace/slug.ts` ↔ `horse-listings.ts`
2. `training/plans/assignments.ts` ↔ `training/plans/fetch-editor.ts`
3. `assignments.ts` → `fetch-editor.ts` → `queries.ts` → `assignments.ts`

### 2.5 Oversized files (>500 lines)

| Lines | File | Category |
|------:|------|----------|
| 4495 | `app/lib/breeds/data.ts` | Static catalog (acceptable) |
| 1790 | `app/lib/constants/countries.ts` | Static catalog (acceptable) |
| 1024 | `app/actions/horse-listings.ts` | **Action monolith** — entire listing domain |
| 746 | `app/components/marketplace/MarketplaceBrowseClient.tsx` | Filters + URL sync + pagination + render |
| 618 | `app/components/breeding-recommendations/StallionMatchClient.tsx` | Multi-mode search + compare + results |
| 567 | `app/actions/traits.ts` | Fat action module |
| 561 | `app/actions/stallions.ts` | Fat action module |
| 533 | `app/components/sell/SellListingForm.tsx` | Wizard + client uploads + validation |
| 531 | `app/components/account/MyStallionsSection.tsx` | List + inline CRUD + media |

### 2.6 Components with too many responsibilities

| Component | Concerns mixed |
|-----------|----------------|
| `MarketplaceBrowseClient` | Filter state, URL sync, debounce, chips, pagination, layout, data fetch |
| `StallionMatchClient` | Mare search, pedigree + goal modes, filters, sort, compare, results |
| `SellListingForm` | Multi-step wizard, validation, browser Supabase uploads, preview, rollback |
| `MyStallionsSection` | List view, inline create/edit, media upload, delete, pedigree fields |
| `horse-listings.ts` (action) | CRUD, media, video, slug, pedigree sync, stats, revalidation |

### 2.7 Dead routes

**None fully orphaned.** All 40 `app/[locale]/` pages are reachable via nav, auth controls, or internal links.

**Weak discoverability (not dead):**
- `/notifications` — bell icon only
- `/account` — auth menu only
- Pedigree/training sub-routes — contextual links only
- Legacy `/horse/[id]` — redirect stubs for old UUID links

**Missing:** No `sitemap.ts` for SEO route discovery.

---

## 3. Infrastructure Verification

### 3.1 App Router

```
app/
├── layout.tsx                         # Root shell, metadataBase
├── [locale]/layout.tsx                # next-intl provider, generateStaticParams
├── [locale]/page.tsx                  # Home
├── [locale]/{marketplace,horses,...}  # 40 locale-scoped pages
├── auth/callback/route.ts             # OAuth exchange
└── proxy.ts                           # i18n + Supabase session (replaces middleware)
```

Route groups: `training/(session)`, `training/plans/(create)`, `training/plans/(editor)`.

### 3.2 i18n

| Component | Path |
|-----------|------|
| Routing config | `i18n/routing.ts` — en/de/fr/nl/es, `localePrefix: "as-needed"` |
| Message loader | `i18n/request.ts` — 23 namespaces |
| Navigation helpers | `i18n/navigation.ts`, `i18n/path.ts` |
| Messages | `messages/{locale}/*.json` — 115 files, structure consistent |

No obsolete localization files detected.

### 3.3 Supabase client usage

| Context | Module | Pattern |
|---------|--------|---------|
| Server Components / actions | `app/lib/supabase/server.ts` | `createServerClient` + cookies |
| Client components | `app/lib/supabase/client.ts` | `createBrowserClient` |
| Proxy / edge | `app/lib/supabase/proxy.ts` | Request/response cookie bridge |
| Env validation | `app/lib/supabase/env.ts` | Central `getSupabaseEnv()` |

No service-role key in codebase — RLS-only architecture (correct for anon-key client).

**Smell:** `DemoModeBanner.tsx` is an async server component under `components/` importing server client directly.

### 3.4 Environment variables

| Variable | Documented | Used |
|----------|:----------:|:----:|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes |
| `NODE_ENV` | No (runtime) | Dev error detail only |

No undocumented secrets required. No `SUPABASE_SERVICE_ROLE_KEY` (by design).

### 3.5 API boundaries

| Layer | Count | Notes |
|-------|------:|-------|
| Server actions | 19 modules | Primary mutation + data boundary |
| Route handlers | 1 | Auth callback only |
| Direct browser Supabase | 2 flows | Login/signup + `SellListingForm` storage uploads |
| Lib query functions | Many | Accept `SupabaseClient` param — reusable from actions/RSC |

**Auth protection inconsistency:** `proxy.ts` guards `/account`, `/sell`, `/admin`, `/dashboard/seller`. Routes like `/notifications`, `/training/*` enforce auth via in-page redirects instead.

---

## 4. Priority Issues

### High priority

| # | Area | Issue | Impact |
|---|------|-------|--------|
| H1 | Database | `horse_listings.verified` has no admin-protection trigger or policy | Sellers can self-verify listings via direct API |
| H2 | Database | Pedigree backfill RPCs granted to `anon` (`017`) | Unauthenticated pedigree mutation possible |
| H3 | Database | Migration drift — 033/034 may leave environments without `search_vector` | Full-text search silently falls back to ILIKE |
| H4 | Architecture | Dual marketplace filter implementations | Inconsistent results between home and browse |
| H5 | Architecture | `horse-listings.ts` action monolith (1024 lines) | High change risk, hard to test |

### Medium priority

| # | Area | Issue | Impact |
|---|------|-------|--------|
| M1 | Database | Orphan columns `favorite_count`, `inquiry_count` | Schema noise; misleading if exposed later |
| M2 | Database | Missing FK index on `pedigree_horses.created_by` | Slow RLS checks at scale |
| M3 | Database | Redundant migrations 031–034 | Confusion about canonical apply order |
| M4 | Architecture | 3 circular import cycles in lib | Bundler/tree-shaking risk; refactor friction |
| M5 | Architecture | `withDevError` duplicated across 5 action files | Inconsistent error formatting |
| M6 | Architecture | Legacy `/horse/{uuid}` links still primary in many components | Extra redirect hop; SEO fragmentation |
| M7 | Architecture | Auth protection split between proxy and page-level redirects | Inconsistent guard behavior |

### Low priority

| # | Area | Issue | Impact |
|---|------|-------|--------|
| L1 | Database | Duplicate GRANT migrations (002, 011) | Harmless on idempotent apply |
| L2 | Database | Unused `breeders.slug`, `external_reference` columns | Schema clutter |
| L3 | Architecture | `PedigreeSection` name collision (sell vs pedigree) | Developer confusion |
| L4 | Architecture | No sitemap | SEO discoverability |
| L5 | Architecture | 2 ESLint hook-dependency warnings | Low runtime risk |
| L6 | Architecture | Image storage module duplication (4 files) | Maintenance overhead |
| L7 | Architecture | Oversized client components (746, 618, 533, 531 lines) | Readability; future refactor targets |

---

## 5. Recommended Fixes Before Beta

These are **recommendations only** — out of scope for this audit sprint.

### Must-fix (security / data integrity)

1. **Add verified-protection trigger on `horse_listings`** — mirror `014` pattern for breeders/stallions.
2. **Revoke `anon` execute on backfill RPCs** (`017`) — restrict to `authenticated` or service role.
3. **Document canonical migration path** — `001→028→029→030`; mark 031–034 as repair-only in `docs/DATABASE.md`.
4. **Audit deployed environments** — confirm `search_vector` column and GIN index exist; re-run 031 if missing.

### Should-fix (consistency / maintainability)

5. **Unify marketplace filtering** — single source of truth in `marketplace/search.ts`; home page delegates to server search or shared filter primitives.
6. **Extract shared `withDevError` + DB error mappers** into `app/lib/errors.ts`.
7. **Break `horse-listings.ts` action** into lib query modules (mirror training/marketplace pattern).
8. **Resolve circular imports** — extract slug utilities and training plan assignment types to leaf modules.
9. **Add index on `pedigree_horses.created_by`**.

### Nice-to-have (post-beta)

10. Drop orphan columns (`favorite_count`, `inquiry_count`) or add maintenance triggers.
11. Migrate internal links from `/horse/{uuid}` to `/horses/{slug}` via `marketplace/paths.ts`.
12. Add `sitemap.ts` for locale-aware route discovery.
13. Rename sell `PedigreeSection` → `ListingPedigreeFormSection`.
14. Centralize auth route protection in `proxy.ts`.
15. Split oversized client components (`MarketplaceBrowseClient`, `StallionMatchClient`).

---

## 6. Score Breakdown

### Database (72 / 100)

| Criterion | Weight | Score | Notes |
|-----------|--------|------:|-------|
| Schema completeness | 20 | 18 | All domains covered; minor orphan columns |
| FK integrity | 15 | 12 | Strong; 2 missing FK indexes |
| Index coverage | 15 | 13 | Good partial/GIN indexes; counter indexes unused |
| Constraints | 10 | 7 | Slug/view_count drift between migration paths |
| RLS policies | 25 | 16 | Comprehensive except listings verified + anon RPCs |
| Migration hygiene | 15 | 6 | 031–034 redundancy and divergence |

### Architecture (74 / 100)

| Criterion | Weight | Score | Notes |
|-----------|--------|------:|-------|
| App Router structure | 15 | 14 | Clean locale-scoped layout |
| i18n architecture | 10 | 10 | Complete, consistent |
| Supabase client patterns | 10 | 9 | Consistent; one server component in components/ |
| API boundaries | 15 | 11 | Action-centric works; 3 fat action modules |
| Code duplication | 20 | 12 | Filters, errors, image storage, scoring helpers |
| Import health | 10 | 7 | 3 circular cycles |
| Component sizing | 10 | 6 | 4 client components + 1 action exceed 500 lines |
| Route hygiene | 10 | 5 | No dead routes; legacy redirects + no sitemap |

---

## 7. Lint & Build Output

```
npm run lint  → 0 errors, 2 warnings
npm run build → success, 134 pages, 40 locale routes
```

Warnings:
- `BreedingLabClient.tsx:209` — `useCallback` missing `t`
- `ExercisePickerModal.tsx:57` — `useEffect` missing deps

---

*Audit performed read-only. No product behavior, translations, migrations, or code were modified.*
