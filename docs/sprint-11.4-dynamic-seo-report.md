# Sprint 11.4 — Dynamic SEO for Public Listings

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** Dynamic `generateMetadata()` + JSON-LD for horse, stallion, and breeder public entity pages.

---

## Routes Updated

| Route | File | Changes |
|-------|------|---------|
| `/[locale]/horses/[slug]` | `app/[locale]/horses/[slug]/page.tsx` | Enhanced `generateMetadata()` with localized entity templates (`metadata.entities.horse`) |
| `/[locale]/stallions/[id]` | `app/[locale]/stallions/[id]/page.tsx` | Added `generateMetadata()` — previously had none |
| `/[locale]/breeders/[id]` | `app/[locale]/breeders/[id]/page.tsx` | Added `generateMetadata()` + Organization JSON-LD script |

### New / Updated SEO Libraries

| File | Purpose |
|------|---------|
| `app/lib/seo/entity-metadata.ts` | Shared entity metadata builder, hreflang alternates, stallion/breeder builders, breeder Organization JSON-LD, template loader |
| `app/lib/marketplace/seo.ts` | Refactored `buildHorseListingMetadata()` to use shared `buildEntityMetadata()` + localized templates |

### Localization

Added `entities.horse`, `entities.stallion`, and `entities.breeder` template keys (7 fields each) to all 5 locale files:

- `messages/en/metadata.json`
- `messages/de/metadata.json`
- `messages/fr/metadata.json`
- `messages/nl/metadata.json`
- `messages/es/metadata.json`

Template placeholders: `{name}`, `{breed}`, `{gender}`, `{age}`, `{price}`, `{breeder}`, `{country}`, `{discipline}`, `{level}`, `{studFee}`, `{breeding}`, `{location}`, `{disciplines}`, `{siteName}`, `{descriptionSnippet}`.

---

## Metadata Coverage (All 3 Routes)

Each public entity page now emits:

| Field | Horse | Stallion | Breeder |
|-------|-------|----------|---------|
| Localized title | ✓ | ✓ | ✓ |
| Localized description | ✓ | ✓ | ✓ |
| Keywords | ✓ | ✓ | ✓ |
| Canonical URL | ✓ | ✓ | ✓ |
| hreflang alternates (en/de/fr/nl/es + x-default) | ✓ | ✓ | ✓ |
| OpenGraph (title, description, url, siteName, locale, alternateLocale, images) | ✓ | ✓ | ✓ |
| Twitter Card (summary_large_image when image present) | ✓ | ✓ | ✓ |
| robots (index/follow) | ✓ active only | ✓ | ✓ |

### Entity Data Used in Metadata

**Horse:** name, breed, sex (gender), age, price, breeder (stable/seller), main/gallery images  
**Stallion:** name, breed, breeding methods, stud fee, discipline, country, cover/gallery image  
**Breeder:** farm name, country, city (location), disciplines, logo/cover image

---

## JSON-LD Added

| Route | Schema Types | Implementation |
|-------|-------------|----------------|
| `/[locale]/horses/[slug]` | **Product**, **Offer**, **Organization** (seller), BreadcrumbList | Existing `buildHorseListingStructuredData()` in page body (unchanged graph structure) |
| `/[locale]/stallions/[id]` | — | No JSON-LD required by sprint scope |
| `/[locale]/breeders/[id]` | **Organization** | New `buildBreederOrganizationJsonLd()` via `<script type="application/ld+json">` |

### Horse JSON-LD Detail (pre-existing, verified)

- `@type: Product` — name, description, images, category, brand (breed)
- `@type: Offer` (nested) — price, currency, availability, url, seller Organization
- `@type: Organization` (seller) — stable/seller name
- `@type: BreadcrumbList` — home → marketplace → breed → listing

### Breeder JSON-LD Detail (new)

- `@type: Organization` — name, url, logo, PostalAddress (country/city), description, sameAs (website)

---

## OpenGraph Coverage

| Route | OG Type | OG Images | OG Locale Alternates |
|-------|---------|-----------|---------------------|
| Horse listing | `website` | Gallery or cover (absolute URLs) | All 5 locales |
| Stallion detail | `website` | Cover or first gallery image | All 5 locales |
| Breeder profile | `website` | Logo or cover image | All 5 locales |

Twitter cards use `summary_large_image` when an entity image is available; `summary` otherwise.

---

## UI Changes

**None.** Only metadata functions and JSON-LD `<script>` tags were added. No component or layout markup was modified.

---

## Validation

### Lint

```
npm run lint
```

**Result:** ✓ Pass — 0 errors, 2 pre-existing warnings (`BreedingLabClient.tsx`, `ExercisePickerModal.tsx`)

### Build

```
npm run build
```

**Result:** ✓ Pass — Next.js 16.2.10 compiled successfully, TypeScript clean, 136 static pages generated.

---

## Summary

Sprint 11.4 delivers production-ready dynamic SEO for all three public entity page types. Horse listings now use fully localized metadata templates across 5 locales. Stallion and breeder detail pages gained complete metadata (canonical, hreflang, OpenGraph, Twitter). Breeder pages received Organization JSON-LD. Build and lint both pass.
