# Sprint 10.1 — Integration Cleanup Report

**Date:** 2026-08-02  
**Commit:** `chore: integration cleanup phase 1`  
**Scope:** Repository hygiene only — no UI, database, or translation content changes.

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (0 errors, 2 warnings) |
| `npm run build` | Pass (134 static pages, 40 locale routes + auth callback) |
| Broken imports | None after dead-file removal |
| Route reachability | All routes under `app/[locale]/` build; legacy non-locale pages removed |

### Lint warnings (pre-existing, non-blocking)

- `BreedingLabClient.tsx` — `useCallback` missing dependency `t`
- `ExercisePickerModal.tsx` — `useEffect` missing dependencies

---

## Removed Files

### Dead components (8)

| File | Reason |
|------|--------|
| `app/components/account/MyListingsSection.tsx` | Replaced by `SellerListingsDashboard` |
| `app/components/breeders/BreederCard.tsx` | Replaced by `BreederCardClient` / `BreederCardView` |
| `app/components/horse/HorsePedigree.tsx` | Unused; pedigree rendered via `PedigreeSection` |
| `app/components/pedigree/PedigreeHorseCard.tsx` | Replaced by `PedigreeHorseCardClient` |
| `app/components/stallions/StallionPedigree.tsx` | Unused server wrapper |
| `app/components/training/TrainingSessionNotes.tsx` | Never imported |
| `app/components/training/plans/TrainingPlanEditorPlaceholder.tsx` | Never imported |
| `app/components/training/TrainingDashboardCard.tsx` | Unused re-export barrel for `DashboardCard` |

### Legacy routes (21 — deleted, locale equivalents live under `app/[locale]/`)

```
app/account/page.tsx
app/admin/breeders/page.tsx
app/admin/layout.tsx
app/admin/page.tsx
app/admin/pedigree/page.tsx
app/admin/stallions/page.tsx
app/admin/traits/page.tsx
app/bloodlines/page.tsx
app/breeders/[id]/page.tsx
app/breeders/page.tsx
app/breeding-lab/page.tsx
app/breeding-recommendations/page.tsx
app/favorites/page.tsx
app/horse/[id]/edit/page.tsx
app/horse/[id]/page.tsx
app/login/page.tsx
app/page.tsx
app/pedigree/[id]/page.tsx
app/pedigree/[id]/traits/page.tsx
app/sell/page.tsx
app/signup/page.tsx
app/stallions/[id]/page.tsx
app/stallions/page.tsx
```

### Unused public assets (5)

| File |
|------|
| `public/next.svg` |
| `public/vercel.svg` |
| `public/globe.svg` |
| `public/file.svg` |
| `public/window.svg` |

### Obsolete audit artifacts (2)

| File |
|------|
| `docs/i18n-missing-keys-report.json` |
| `docs/i18n-missing-keys-report.md` |

---

## Removed Imports & Symbols

### Unused imports removed (lint cleanup)

| File | Removed |
|------|---------|
| `ListingTrainingSummarySection.tsx` | `PublicHealthSummarySnapshot` |
| `SellerDashboardClient.tsx` | `tCommon` |
| `BreedingLabClient.tsx` | `BREEDING_MAX_GENERATIONS` |
| `scripts/audit-i18n-keys.mjs` | `firstKeyPart` |
| `scripts/breeds-catalog.mjs` | `pony()` helper |
| `SearchableSelect.tsx` / `SearchableMultiSelect.tsx` | Unused `setHighlightIndex` in effects |

### Dead helper functions removed

| File | Symbol |
|------|--------|
| `app/lib/listing-media.ts` | `uploadListingMedia()` |
| `app/lib/pedigree.ts` | `buildLegacyPedigreeTree()` |

### Other lint / type fixes

| File | Change |
|------|--------|
| `i18n/request.ts` | Renamed `module` import binding → `importedMessages` |
| `app/lib/marketplace/search.ts` | Supabase query helper typing (avoids deep generic instantiation) |
| `app/actions/horse-listings.ts` | Unused `slugError` catch binding |
| `MarketplaceBrowseClient.tsx` | ESLint exception for URL-sync effect |

---

## Duplicate Code Found (not consolidated in this phase)

| Area | Locations | Notes |
|------|-----------|-------|
| Price formatting | `horse-listings.ts` (`formatListingRowPrice`), `listing-validation.ts` (`formatListingPrice`) | Same output, different input types |
| Score clamping | `training/rules/helpers.ts` (`clampScore`), `health/rules/helpers.ts` (`clampHealthScore`) | Identical logic |
| Severity mapping | `training/rules/helpers.ts`, `health/rules/helpers.ts`, `events/format.ts` | Same thresholds |
| Date helpers | `training/format.ts`, `health/format.ts`, `events/format.ts` | Overlapping ISO date utilities |
| Image storage boilerplate | `horse-image-storage.ts`, `stallion-image-storage.ts`, `breeder-image-storage.ts`, `horse-video-storage.ts` | Repeated sanitize/path/validate patterns |
| Training re-export barrels | `TrainingEmptyState.tsx`, `TrainingErrorState.tsx` | Thin wrappers over `shared/EmptyState` / `ErrorState` |

---

## Remaining Technical Debt

1. **Legacy UUID redirects** — `app/[locale]/horse/[id]/` and `edit` redirect to slug-based URLs; keep until analytics confirm no traffic.
2. **2 ESLint hook-dependency warnings** — low risk; fix in a focused hooks pass.
3. **Image storage duplication** — four near-copy modules; candidate for shared `storage-utils` abstraction.
4. **Price/severity/date helpers** — domain-split duplicates; consolidate behind shared primitives when touching those modules.
5. **OpenAI training provider stub** — `app/lib/training/rules/openai-provider.ts` kept intentionally per release checklist.
6. **Database migrations 028–034** — present locally; must be applied in target environments before beta.
7. **i18n completeness** — buyer/seller paths may still have untranslated keys outside committed namespaces.

---

## Recommended Next Cleanup Batch (Phase 2)

1. Migrate imports from `TrainingEmptyState` / `TrainingErrorState` barrels → `shared/EmptyState` / `ErrorState`, then delete barrels.
2. Extract shared `clampScore` / `severityFromScore` into `app/lib/shared/scoring.ts`.
3. Extract shared image-storage primitives from the four `*-image-storage.ts` modules.
4. Remove legacy `/horse/[uuid]` redirect routes after 30-day traffic check.
5. Resolve remaining `react-hooks/exhaustive-deps` warnings with intentional dependency arrays or ref patterns.
6. Run `scripts/audit-i18n-keys.mjs` and close any remaining key gaps in non-marketplace namespaces.

---

## Route Map (post-cleanup)

All user-facing pages live under `app/[locale]/` (40 routes). Auth callback remains at `app/auth/callback/route.ts`. No duplicate page components serving the same URL.
