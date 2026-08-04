# Sprint 11.1 — SEO Metadata Audit Report

**Date:** 2026-08-03  
**Scope:** Read-only audit — no code modified  
**Framework:** Next.js 16 App Router + `next-intl` (`localePrefix: "as-needed"`)

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Total route patterns | 40 |
| Routes with route-specific metadata | **3** (7.5%) |
| Routes relying on root layout defaults only | **37** (92.5%) |
| Routes with full metadata coverage (all 8 fields) | **1** (`/horses/[slug]`) |
| `keywords` defined anywhere | **0** |
| `metadata.json` i18n namespace | **Empty** (`{}`) |
| Sitemap | **Not present** |

Only **listing detail pages** (`/horses/[slug]`) have production-grade SEO metadata. The marketplace hub and browse pages have partial coverage. All other routes inherit generic site defaults from the root layout.

---

## Global Metadata (Root Layout)

**File:** `app/layout.tsx`

| Field | Status | Value / Notes |
|-------|--------|---------------|
| **metadataBase** | ✅ Present | `NEXT_PUBLIC_SITE_URL` or fallback `https://equimaster.pro` |
| **title** | ✅ Present | Default: `"EquiMaster Pro"`; template: `"%s \| EquiMaster Pro"` |
| **description** | ✅ Present | Generic site-wide marketplace description (English only) |
| **keywords** | ❌ Missing | Not defined |
| **alternates** | ❌ Missing | No `canonical`, no `languages` (hreflang) |
| **openGraph** | ❌ Missing | No OG tags at root |
| **twitter** | ❌ Missing | No Twitter card tags at root |

This metadata applies as fallback to **all 40 routes** unless overridden by a page-level `generateMetadata`.

**Locale layout** (`app/[locale]/layout.tsx`) exports **no metadata** — no locale-aware defaults.

---

## Route-Specific Metadata Coverage

### Tier 1 — Full coverage (1 route)

| Route | Source | title | description | keywords | metadataBase | alternates | canonical | openGraph | twitter |
|-------|--------|:-----:|:-----------:|:--------:|:------------:|:----------:|:---------:|:---------:|:-------:|
| `/horses/[slug]` | `buildHorseListingMetadata()` | ✅ Dynamic | ✅ Dynamic | ❌ | ↔ inherited | ✅ | ✅ Absolute | ✅ Full | ✅ `summary_large_image` |

**Notes:**
- Canonical URL is absolute and locale-aware via `localizePath()`.
- Hreflang alternates for all 5 locales + `x-default`.
- OG includes `locale`, `alternateLocale`, images, `siteName`, `type`, `url`.
- Inactive/draft listings return `robots: { index: false }` with minimal title only.
- JSON-LD structured data rendered in page body (Product + BreadcrumbList) — not part of `Metadata` API but positive for SEO.

---

### Tier 2 — Partial coverage (2 routes)

| Route | Source | title | description | keywords | alternates | canonical | openGraph | twitter |
|-------|--------|:-----:|:-----------:|:--------:|:----------:|:---------:|:---------:|:-------:|
| `/marketplace` | `buildMarketplaceMetadata()` | ✅ | ✅ | ❌ | ⚠️ | ✅ Relative `/marketplace` | ⚠️ Partial | ❌ |
| `/horses` | `buildHorsesBrowseMetadata()` | ✅ | ✅ | ❌ | ⚠️ | ✅ Relative `/horses` | ❌ | ❌ |

**Partial gaps:**
- **No hreflang** (`alternates.languages`) — English-default URL strategy not reflected in metadata.
- **No Twitter cards** on either route.
- **`/marketplace` OpenGraph** lacks `locale`, `alternateLocale`, and `images`.
- **Neither route is localized** — titles/descriptions hardcoded in English in `app/lib/marketplace/seo.ts`.
- **Filter query strings** on `/horses?…` share one canonical (`/horses`) — acceptable, but no dynamic titles for filtered views.

---

### Tier 3 — Root defaults only (37 routes)

These routes export **no** `metadata` or `generateMetadata`. They inherit only root layout fields (generic title template, generic description, metadataBase). They are **missing route-specific** title, description, keywords, alternates, canonical, OpenGraph, and Twitter metadata.

#### Public / marketing (11)

| Route | Recommended index? |
|-------|-------------------|
| `/` (home) | Yes — high priority |
| `/stallions` | Yes |
| `/stallions/[id]` | Yes — per-entity |
| `/breeders` | Yes |
| `/breeders/[id]` | Yes — per-entity |
| `/bloodlines` | Yes |
| `/breeding-lab` | Yes |
| `/breeding-recommendations` | Yes |
| `/favorites` | No — auth-gated content |
| `/login` | No |
| `/signup` | No |

#### Marketplace / seller (6)

| Route | Notes |
|-------|-------|
| `/sell` | Auth-gated — should be `noindex` |
| `/account` | Auth-gated — should be `noindex` |
| `/dashboard/seller` | Auth-gated — should be `noindex` |
| `/dashboard/seller/listings/[id]/edit` | Auth-gated — should be `noindex` |
| `/dashboard/seller/listings/[id]/preview` | Auth-gated — should be `noindex` |
| `/horse/[id]` | Legacy UUID redirect → `/horses/[slug]` — metadata not emitted before redirect |
| `/horse/[id]/edit` | Legacy redirect — metadata not emitted |

#### Training (8)

| Route | Notes |
|-------|-------|
| `/training` | Auth-gated — should be `noindex` |
| `/training/analytics` | Auth-gated |
| `/training/health` | Auth-gated |
| `/training/timeline` | Auth-gated |
| `/training/plans` | Auth-gated |
| `/training/plans/new` | Auth-gated |
| `/training/plans/[id]` | Auth-gated |
| `/training/session/[id]` | Auth-gated |

#### Pedigree (5)

| Route | Notes |
|-------|-------|
| `/pedigree/[id]` | Mixed — may be public; needs per-horse metadata |
| `/pedigree/[id]/traits` | Likely auth-gated |
| `/pedigree/[id]/timeline` | Likely auth-gated |
| `/pedigree/[id]/health` | Auth-gated |
| `/pedigree/[id]/analytics` | Auth-gated |

#### Admin (5)

| Route | Notes |
|-------|-------|
| `/admin` | Must be `noindex, nofollow` |
| `/admin/breeders` | Must be `noindex, nofollow` |
| `/admin/stallions` | Must be `noindex, nofollow` |
| `/admin/pedigree` | Must be `noindex, nofollow` |
| `/admin/traits` | Must be `noindex, nofollow` |

#### Other (2)

| Route | Notes |
|-------|-------|
| `/notifications` | Auth-gated — should be `noindex` |

---

## Field-by-Field Audit (All Routes)

| Field | App-wide status |
|-------|-----------------|
| **metadataBase** | ✅ Set once in root layout; resolves relative canonical/OG URLs |
| **title** | ⚠️ 3 routes custom; 37 use generic default `"EquiMaster Pro"` |
| **description** | ⚠️ 3 routes custom; 37 use generic English description |
| **keywords** | ❌ **Not used anywhere** — no route defines `metadata.keywords` |
| **alternates.canonical** | ⚠️ 3 routes only; no locale prefix in marketplace/horses canonicals |
| **alternates.languages** | ⚠️ Listing detail only — no hreflang on any other route |
| **openGraph** | ⚠️ Listing detail (full) + marketplace (partial); 38 routes missing |
| **twitter** | ⚠️ Listing detail only; 39 routes missing |

---

## i18n & Metadata Architecture

| Item | Status |
|------|--------|
| `messages/{locale}/metadata.json` | Exists for all 5 locales but **empty `{}`** |
| `i18n/request.ts` loads `metadata` namespace | Yes — infrastructure ready, unused |
| Locale-aware `generateMetadata` | Only `/horses/[slug]` passes locale to builder |
| `localePrefix: "as-needed"` | Default locale (en) has no URL prefix; alternates must account for this — only listing pages do |

---

## Dynamic Route Metadata Gaps

These dynamic routes serve **unique public content** but have **no per-entity metadata**:

| Pattern | Public content | Missing |
|---------|----------------|---------|
| `/stallions/[id]` | Stallion profile | Dynamic title, description, OG image, canonical |
| `/breeders/[id]` | Breeder profile | Dynamic title, description, OG image, canonical |
| `/pedigree/[id]` | Pedigree horse | Dynamic title, description, canonical |
| `/horses` (with filters) | Filtered browse | Dynamic title per filter combo (optional) |

---

## Auth / Private Route Concerns

Routes without metadata also lack explicit **`robots: { index: false }`**. Search engines may index auth-gated pages if they discover URLs, seeing only the generic site title/description:

- `/admin/*` (5 routes)
- `/training/*` (8 routes)
- `/dashboard/seller/*` (3 routes)
- `/account`, `/sell`, `/favorites`, `/notifications`
- `/login`, `/signup`

**Recommendation (future sprint):** Add `robots: { index: false, follow: false }` to all auth-gated routes at minimum.

---

## Complete List — Routes Missing Route-Specific Metadata

All paths relative to `/[locale]/` (40 patterns):

```
/                                          ← home
/account
/admin
/admin/breeders
/admin/pedigree
/admin/stallions
/admin/traits
/bloodlines
/breeders
/breeders/[id]
/breeding-lab
/breeding-recommendations
/dashboard/seller
/dashboard/seller/listings/[id]/edit
/dashboard/seller/listings/[id]/preview
/favorites
/horse/[id]                                  ← redirect only
/horse/[id]/edit                             ← redirect only
/login
/notifications
/pedigree/[id]
/pedigree/[id]/analytics
/pedigree/[id]/health
/pedigree/[id]/timeline
/pedigree/[id]/traits
/sell
/signup
/stallions
/stallions/[id]
/training
/training/analytics
/training/health
/training/plans
/training/plans/[id]
/training/plans/new
/training/session/[id]
/training/timeline
```

**Routes WITH route-specific metadata (for reference):**

```
/marketplace                                 ← partial
/horses                                      ← minimal
/horses/[slug]                               ← full
```

---

## Additional Observations

1. **No sitemap** (`sitemap.ts` / `sitemap.xml`) — search engines cannot discover locale routes systematically.
2. **No `robots.ts`** — no centralized crawl rules.
3. **OG images** — only listing detail pages provide social preview images.
4. **Hardcoded English SEO copy** in `app/lib/marketplace/seo.ts` — conflicts with 5-locale product; `metadata.json` namespace unused.
5. **Root description** is English-only while UI supports de/fr/nl/es.

---

## Priority Matrix (Informational — Not Implemented)

| Priority | Route(s) | Suggested action |
|----------|----------|------------------|
| P0 | `/` | Localized title, description, OG, hreflang |
| P0 | `/stallions`, `/breeders`, `/bloodlines` | Directory metadata + entity pages |
| P0 | `/stallions/[id]`, `/breeders/[id]` | Dynamic OG + canonical |
| P1 | `/marketplace`, `/horses` | Complete OG/Twitter + hreflang + i18n |
| P1 | Auth-gated routes (26) | `robots: noindex` |
| P1 | `/admin/*` | `robots: noindex, nofollow` |
| P2 | `/pedigree/[id]` | Public pedigree metadata |
| P2 | All routes | Populate `messages/*/metadata.json` |
| P2 | App-wide | Add `sitemap.ts` with locale alternates |
| P3 | `/horses?filters` | Optional dynamic titles |
| P3 | App-wide | `keywords` (low SEO value in 2026; optional) |

---

## Source File Reference

| File | Role |
|------|------|
| `app/layout.tsx` | Root metadata (metadataBase, title, description) |
| `app/[locale]/layout.tsx` | No metadata |
| `app/lib/marketplace/seo.ts` | Builders for listing, marketplace, browse |
| `app/[locale]/horses/[slug]/page.tsx` | `generateMetadata` → listing builder |
| `app/[locale]/marketplace/page.tsx` | `generateMetadata` → marketplace builder |
| `app/[locale]/horses/page.tsx` | `generateMetadata` → browse builder |
| `messages/{en,de,fr,nl,es}/metadata.json` | Empty — unused |

---

*Audit performed read-only. No application code was modified.*
