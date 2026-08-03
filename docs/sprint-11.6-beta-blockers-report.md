# Sprint 11.6 — Beta Blockers Report

**Date:** 2026-08-03  
**Branch:** `main` (uncommitted)  
**Scope:** Resolve Sprint 11.5 audit blockers within localization, entity UI, protected routes, metadata dedup, and pedigree N+1 — no new features, no UI design changes.

---

## Executive Summary

| Task | Verdict |
|------|---------|
| 1. Localization (stallions/breeders) | **PASS** |
| 2. Remove hardcoded UI strings | **PASS** |
| 3. Protected routes | **PASS** |
| 4. Metadata fetch dedup | **PASS** |
| 5. Pedigree query (N+1) | **PASS** |
| Validation (lint + build) | **PASS** |

All five sprint deliverables completed. Sprint 11.5 **auth/security P0 items** (password reset, open redirect, migration 035, trait view) were **out of scope** for this sprint and remain **WARNING/FAIL** — see Sprint 11.5 report.

---

## 1. Localization

**Verdict: PASS**

Translated all keys in:

| File | Locales | Keys added/updated |
|------|---------|-------------------|
| `messages/{de,fr,nl,es}/stallions.json` | de, fr, nl, es | Full file — directory, availability, card, premium, contact, pedigree, **detail** |
| `messages/{de,fr,nl,es}/breeders.json` | de, fr, nl, es | Full file — directory, card, **detail** |
| `messages/en/stallions.json` | en | Added `detail.*` section (18 keys) |
| `messages/en/breeders.json` | en | Added `detail.*` section (11 keys) |

**Verification:** Automated diff confirms de/fr/nl/es files are **no longer byte-identical** to English for either namespace.

**Evidence:**
- German example: `"title": "Hengstverzeichnis"` (was `"Stallion Directory"`)
- French example: `"title": "Répertoire des éleveurs & haras"`

---

## 2. Remove Hardcoded UI Strings

**Verdict: PASS**

### `app/[locale]/stallions/[id]/page.tsx`

| Before (hardcoded) | After (i18n key) |
|--------------------|------------------|
| `← Back to Stallion Directory` | `stallions.detail.backToDirectory` |
| `{name} cover` | `stallions.detail.coverAlt` |
| `STALLION_AVAILABILITY_LABELS[...]` | `stallions.availability.{status}` |
| `Birth Year`, `Age`, `Color`, etc. | `stallions.detail.*` |
| `Use in Breeding Lab →` | `stallions.detail.useInBreedingLab` |
| `About`, `Competition & Performance`, etc. | `stallions.detail.about`, etc. |

Removed import of `STALLION_AVAILABILITY_LABELS` and `getStallionById` (replaced with cached wrapper).

### `app/[locale]/breeders/[id]/page.tsx`

| Before (hardcoded) | After (i18n key) |
|--------------------|------------------|
| `{name} cover` / `logo` | `breeders.detail.coverAlt` / `logoAlt` |
| `About`, `Stallions`, `Horses For Sale` | `breeders.detail.*` |
| `Contact`, contact description | `breeders.detail.contact`, `contactDescription` |
| `Website`, no-contact message | `breeders.detail.website`, `noContactDetails` |
| `← Back to Breeder Directory` | `breeders.detail.backToDirectory` |

**No markup or styling changes** — string substitution only via `getTranslations("stallions")` / `getTranslations("breeders")`.

---

## 3. Protected Routes

**Verdict: PASS**

Updated `app/lib/supabase/proxy.ts`:

```typescript
const protectedRoutes = [
  "/account",
  "/sell",
  "/admin",
  "/dashboard/seller",
  "/favorites",      // added
  "/training",       // added (covers /training/* via startsWith)
  "/notifications",  // added
];
```

**Behavior:** Unauthenticated requests to these paths are redirected to `loginRedirectPath(currentPath)` before page render. Locale-prefixed paths (`/de/favorites`, etc.) are normalized via `getPathnameWithoutLocale()` before matching.

**Note:** `/pedigree/*/health|timeline|analytics` and `/horse/*/edit` remain page-level protected only (not in sprint scope).

---

## 4. Metadata Fetch Dedup

**Verdict: PASS**

### Horse listings — `app/[locale]/horses/[slug]/page.tsx`

- New: `app/lib/marketplace/listing-profile-cache.ts`
- `getCachedPublicListingProfileBySlug(slug)` wraps `buildPublicListingProfileBySlug` with React `cache()`
- `generateMetadata()` uses cached fetch
- Page component uses cached fetch first; falls back to owner-scoped fetch only when profile is null and user is authenticated (draft preview)

**Effect:** Active listing pages no longer double-fetch between metadata and page in the same request.

### Stallion / Breeder — entity pages

- New: `app/lib/entity-profile-cache.ts`
- `getCachedStallionById` / `getCachedBreederById` wrap server actions with `cache()`
- Both `generateMetadata()` and page components share the same cached result per request

---

## 5. Pedigree Query (N+1)

**Verdict: PASS**

Refactored `loadPedigreeTree()` in `app/lib/pedigree.ts`:

| Before | After |
|--------|-------|
| Recursive per-node `.maybeSingle()` queries (up to ~31 for depth-4 tree) | BFS batch loading with `.in("id", toFetch)` per generation |
| N queries (one per node) | ~5 queries max (one per generation level) |
| Synchronous tree build from in-memory map | Same API signature and return type preserved |

**Algorithm:**
1. BFS collect ancestor IDs up to `maxGenerations`
2. Batch-fetch missing rows per frontier
3. Build tree synchronously from `rowsMap`

**Used by:** `getPedigreeTreeById()` → public listing pedigree section, pedigree profile pages.

**Remaining WARNING (out of scope):** `getPedigreeProfile()` still re-fetches sire/dam names after tree load — minor redundancy, not N+1.

---

## Validation

### Lint

```
npm run lint
```

| Result | Detail |
|--------|--------|
| **PASS** | 0 errors, 2 pre-existing warnings |

### Build

```
npm run build
```

| Result | Detail |
|--------|--------|
| **PASS** | Next.js 16.2.10 — compiled successfully, TypeScript clean, 136 pages |

---

## Files Changed

| File | Change |
|------|--------|
| `messages/en/stallions.json` | Added `detail` section |
| `messages/en/breeders.json` | Added `detail` section |
| `messages/{de,fr,nl,es}/stallions.json` | Full translation |
| `messages/{de,fr,nl,es}/breeders.json` | Full translation |
| `app/[locale]/stallions/[id]/page.tsx` | i18n + cached fetch |
| `app/[locale]/breeders/[id]/page.tsx` | i18n + cached fetch |
| `app/[locale]/horses/[slug]/page.tsx` | Cached metadata/page fetch |
| `app/lib/supabase/proxy.ts` | Extended protected routes |
| `app/lib/marketplace/listing-profile-cache.ts` | New — React cache wrapper |
| `app/lib/entity-profile-cache.ts` | New — React cache wrapper |
| `app/lib/pedigree.ts` | Batched `loadPedigreeTree()` |

---

## Remaining Beta Items (Sprint 11.5 — Not in 11.6 Scope)

| Item | Status | Notes |
|------|--------|-------|
| Password reset | **FAIL** | Not implemented |
| Login open redirect | **FAIL** | `LoginForm.tsx` `?next=` unvalidated |
| Migration 035 in production | **WARNING** | Manual application required |
| `horse_trait_assessments_public` view | **FAIL** | RLS bypass — needs DB migration |
| Stallion JSON-LD | **WARNING** | Metadata only |
| Locale-aware JSON-LD URLs | **WARNING** | Horse/breeder structured data |

---

## Conclusion

Sprint 11.6 resolves all in-scope beta blockers from the Sprint 11.5 audit: stallion/breeder localization, entity detail page i18n, proxy route protection, metadata request deduplication, and pedigree tree batch loading. Lint and build pass. Changes are **not committed** per sprint instructions.

**Overall sprint result: PASS**
