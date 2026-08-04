# Sprint 11.5 — Beta Readiness & End-to-End Audit

**Date:** 2026-08-03  
**Project:** EquiMaster Pro (`1.0.0-rc1`)  
**Branch:** `main` @ `a65c3af`  
**Mode:** Read-only audit — no code changes, no commit  
**Stack:** Next.js 16.2.10 · Supabase · next-intl (en/de/fr/nl/es)

---

## Executive Summary

EquiMaster Pro is **functionally ready for a controlled beta** with core marketplace, auth, and SEO flows implemented end-to-end. Build and lint pass cleanly. Beta launch should be **blocked or gated** until three P0 items are resolved: **password reset**, **login open-redirect fix**, and **confirmation that migration `035_security_hardening_before_beta.sql` is applied in production** (plus trait-assessments public view hardening).

| Category | Verdict | Summary |
|----------|---------|---------|
| 1. Authentication | **WARNING** | Sign up / login / logout / session work; password reset missing; proxy coverage incomplete |
| 2. Marketplace | **PASS** | Full seller and buyer journeys implemented; minor UX polish gaps |
| 3. Horse Pages | **PASS** | Public entity pages, dynamic SEO, and JSON-LD (horse + breeder) in place |
| 4. Localization | **WARNING** | Infrastructure solid; stallion/breeder copy and detail UIs largely English-only |
| 5. Database | **WARNING** | RLS/indexes/search strong; 3 unsafe patterns if migrations not fully applied |
| 6. Performance | **WARNING** | No bundle bloat; pedigree N+1 and duplicate fetches on hot paths |
| 7. Accessibility | **WARNING** | Forms/labels good on auth and sell flows; empty alt text in admin tables |
| 8. Security | **WARNING** | Strong RLS + server-action auth; open redirect and missing password reset |
| 9. Build Validation | **PASS** | Lint 0 errors; production build succeeds |

**Recommended beta gate:** Fix P0 security/auth items, apply migration 035, translate stallion/breeder namespaces before marketing to non-English markets.

---

## 1. Authentication

**Category verdict: WARNING**

| Check | Verdict | Evidence |
|-------|---------|----------|
| Sign up | **PASS** | `SignupForm.tsx` → `supabase.auth.signUp()` with email confirm, profile bootstrap trigger (`014_profiles_admin_verification.sql`) |
| Login | **PASS** | `LoginForm.tsx` → `signInWithPassword()`; validation in `auth-validation.ts` |
| Logout | **PASS** | `LogoutButton.tsx` → `signOut()` + `router.refresh()` |
| Password reset | **FAIL** | No forgot-password page, form, or `resetPasswordForEmail` / `updateUser` usage anywhere in codebase |
| Protected routes | **WARNING** | Proxy protects `/account`, `/sell`, `/admin`, `/dashboard/seller` (`app/lib/supabase/proxy.ts` L7). `/favorites`, `/training/*`, `/notifications`, `/horse/*/edit`, `/pedigree/*/health|timeline|analytics` rely on page-level redirects only |
| Session persistence | **PASS** | Root `proxy.ts` → `updateSession()` refreshes Supabase cookies via `getClaims()` on each request; browser client + `onAuthStateChange` in navbar |
| Auth callback (email/OAuth) | **PASS** | `app/auth/callback/route.ts` — `exchangeCodeForSession`, safe `next` validation |
| Auth-page redirect when logged in | **WARNING** | Logged-in users on `/login`/`/signup` redirected to `/account` without locale prefix — may drop `/de/`, `/fr/` context |

### Notes

- Signup handles duplicate accounts (`identities.length === 0`) and missing Supabase config gracefully.
- Admin uses two-layer auth: proxy + `admin/layout.tsx` with `isCurrentUserAdmin()`.
- **Beta blocker:** Users cannot self-recover passwords without Supabase dashboard intervention.

---

## 2. Marketplace

**Category verdict: PASS**

| Check | Verdict | Evidence |
|-------|---------|----------|
| Create listing | **PASS** | `/sell` → `SellListingForm` → `createHorseListing` with rollback on failure (`horse-listings.ts`) |
| Edit listing | **PASS** | `/dashboard/seller/listings/[id]/edit` → `updateHorseListing`; owner-scoped fetch |
| Delete listing | **PASS** | `deleteHorseListing` removes storage + DB row; UI on seller dashboard and account |
| Upload images | **PASS** | `MediaSection.tsx` + `horse-image-storage.ts`; bucket `horse-images`, 12 images / 10 MB each |
| Seller dashboard | **PASS** | `/dashboard/seller` — stats, grouped listings, lifecycle actions, inquiries |
| Public listing page | **PASS** | `/horses/[slug]` — gallery, info, pedigree, contact, related horses, owner preview for drafts |
| Search | **PASS** | `searchMarketplaceListings` — `textSearch("search_vector")` with ilike fallback |
| Filters | **PASS** | Breed, country, gender, discipline, level, price/age/height ranges, sort, pagination via URL state |
| Favorites | **PASS** | `addFavorite` / `removeFavorite`; active listings only; `/favorites` page with optimistic UI |

### Warnings (non-blocking)

| Issue | Verdict | Detail |
|-------|---------|--------|
| Success screens unreachable | **WARNING** | `ListingSuccess` / `ListingEditSuccess` never shown — flow always redirects |
| Legacy `/horse/{uuid}` links | **WARNING** | Redirect works; canonical path is `/horses/{slug}` — split URL patterns in UI |
| Favorite on draft preview | **WARNING** | Button shown to owner; server rejects non-active listings with no error UI |
| Dual seller dashboards | **WARNING** | Full dashboard at `/dashboard/seller`; partial duplicate at `/account` |
| `/favorites` not in proxy | **WARNING** | Page-level auth redirect only — extra round trip |
| Fresh Supabase env | **WARNING** | Without migrations 001–034 + storage bucket, create/upload/search fail (env-dependent, not app bug) |

---

## 3. Horse Pages

**Category verdict: PASS**

| Check | Verdict | Evidence |
|-------|---------|----------|
| Horse details (public listing) | **PASS** | `app/[locale]/horses/[slug]/page.tsx` — full layout, owner preview, view count increment |
| Stallion page | **PASS** | `app/[locale]/stallions/[id]/page.tsx` — gallery, pedigree, traits, contact |
| Breeder page | **PASS** | `app/[locale]/breeders/[id]/page.tsx` — profile, stallions, listings, contact |
| Dynamic SEO | **PASS** | `generateMetadata()` on all 3 entity routes via `entity-metadata.ts` + localized templates |
| JSON-LD | **WARNING** | Horse: Product + Offer + Organization (seller) + BreadcrumbList ✓. Breeder: Organization ✓. Stallion: none (metadata only) |
| Metadata (title, desc, canonical, hreflang, OG, Twitter) | **PASS** | All 3 routes emit full metadata; inactive horse listings get `noindex` |

### Warnings

| Issue | Verdict | Detail |
|-------|---------|--------|
| Stallion JSON-LD absent | **WARNING** | No structured data on stallion detail — SEO gap vs horse/breeder |
| JSON-LD URLs not locale-prefixed | **WARNING** | Horse breadcrumbs and breeder Organization use default-locale paths while canonical tags are localized |
| Stallion/breeder detail UI English | **WARNING** | Hardcoded strings ("Back to Stallion Directory", "About", "Contact", etc.) — see Localization §4 |

---

## 4. Localization

**Category verdict: WARNING**

Locales verified: **en · de · fr · nl · es**

| Check | Verdict | Evidence |
|-------|---------|----------|
| No missing namespaces | **PASS** | 23 namespace files per locale; automated compare — all locales match `en` file set |
| No missing metadata keys | **PASS** | `metadata.json` key parity — 0 missing/extra keys in de/fr/nl/es vs en |
| No broken routes | **PASS** | `i18n/routing.ts` — 5 locales, `localePrefix: "as-needed"`; invalid locale → `notFound()`; proxy + sitemap include locale alternates |
| Entity SEO templates translated | **PASS** | `metadata.entities.{horse,stallion,breeder}` present and translated in all 5 locales |
| Static page metadata translated | **PASS** | `metadata.pages.*` — 17 pages × 7 fields per locale |
| Stallion namespace content | **FAIL** | `messages/{de,fr,nl,es}/stallions.json` **byte-identical to en** — directory UI shows English on localized routes |
| Breeder namespace content | **FAIL** | `messages/{de,fr,nl,es}/breeders.json` **byte-identical to en** |
| Stallion detail page UI | **FAIL** | `stallions/[id]/page.tsx` — no `getTranslations` in render; hardcoded English |
| Breeder detail page UI | **FAIL** | `breeders/[id]/page.tsx` — same |
| Availability labels on stallion page | **FAIL** | Uses hardcoded `STALLION_AVAILABILITY_LABELS` instead of i18n keys |
| Breadcrumb label (fr/es) | **WARNING** | `marketplace.listingPage.breadcrumbMarketplace` remains "Marketplace" in fr/es JSON-LD breadcrumbs |

### Notes

- Horse listing page is fully localized (`marketplace`, `horse`, `nav`, `common` namespaces).
- i18n **infrastructure** is production-grade; **content** for stallions/breeders was never translated despite namespace parity.

---

## 5. Database

**Category verdict: WARNING**

| Check | Verdict | Evidence |
|-------|---------|----------|
| RLS enabled | **PASS** | All application tables in migrations have RLS; owner-scoped policies + admin overrides |
| Policies | **PASS** | Listings, favorites, inquiries, training, health, breeding — consistent `auth.uid()` / `is_admin()` patterns |
| Triggers | **PASS** | Verified-badge protection (breeders, stallions, pedigree); trait submission enforcement; search_vector maintenance |
| Indexes | **PASS** | FK columns indexed across inquiries, training, health, pedigree, marketplace |
| Search | **PASS** | Weighted `tsvector`, GIN index, trigger + backfill (`029`, `035`) |
| Foreign keys | **PASS** | Defined with indexes on join columns |
| Storage policies | **PASS** | User-folder scoped upload/delete (`003_horse_images_storage.sql`) |
| Admin role escalation blocked | **PASS** | `profiles.role` — no user UPDATE policy; `is_admin()` REVOKED FROM PUBLIC |

### Unsafe patterns (require action)

| Issue | Verdict | Detail |
|-------|---------|--------|
| `horse_trait_assessments_public` view | **FAIL** | `security_invoker = false`, no `verified = true` filter, granted to `anon` — exposes unverified trait data, bypasses RLS (`019_horse_traits_breeding_goals.sql`) |
| Backfill RPCs callable by anon | **FAIL** | `backfill_listing_pedigree_horse` / `backfill_stallion_pedigree_horse` granted to `anon` in migration 017; fixed in **035** (manual-only) |
| Listing `verified` self-elevation | **FAIL** | Owners can set `verified = true` unless migration **035** trigger `protect_horse_listing_verified` is applied |
| Migration 035 manual application | **WARNING** | Header: "Run manually in Supabase Dashboard" — production security depends on operator discipline |
| `pedigree_horses` fully public | **WARNING** | Intentional for bloodlines; all rows world-readable including unverified |
| View count RPC — no rate limit | **WARNING** | `increment_horse_listing_view_count` granted to `anon`; inflation possible |
| Search ilike fallback | **WARNING** | 12-column OR scan if `search_vector` column missing — sequential scan at scale |

---

## 6. Performance

**Category verdict: WARNING**

| Check | Verdict | Evidence |
|-------|---------|----------|
| N+1 queries | **FAIL** | `loadPedigreeTree()` in `app/lib/pedigree.ts` — one query per tree node (up to ~31 for depth-5); used on public listing pedigree section |
| Large client bundles | **PASS** | No heavy chart libraries; lean deps; `framer-motion` only notable client lib |
| Slow routes | **WARNING** | 25+ pages use `export const dynamic = "force-dynamic"` — no ISR/cache on public catalog |
| Duplicate fetches | **WARNING** | `horses/[slug]` — `generateMetadata` and page each call `buildPublicListingProfileBySlug` |
| Duplicate fetches (account) | **WARNING** | `getMyHorseListings()` + `getSellerListingStats()` — separate queries, each calls `getUser()` |
| Home page over-fetch | **WARNING** | `getActiveHorseListings(100)` with `select *`; client paginates 6 per page |
| View count blocks render | **WARNING** | `incrementListingViewCount` awaited before page HTML on every active listing view |
| Navbar notification poll | **WARNING** | `NotificationBell` server action on every authenticated page mount |
| Batched patterns (good) | **PASS** | `loadPedigreeGraph`, training plan editor, marketplace search GIN, seller dashboard aggregates |

---

## 7. Accessibility

**Category verdict: WARNING**

Quick static audit (no automated axe run in this sprint).

| Check | Verdict | Evidence |
|-------|---------|----------|
| Buttons | **PASS** | Auth, sell, marketplace, favorites use semantic `<button>` / `<Link>`; icon buttons generally have text or context |
| Forms | **PASS** | Auth forms (`LoginForm`, `SignupForm`) and sell flow (`FormField`, `BasicInfoSection`, etc.) use labeled inputs |
| Labels | **PASS** | `htmlFor` + matching `id` on auth and sell forms; inquiry form labels present |
| Alt text | **WARNING** | Entity pages use descriptive alt (`{name} cover`, `{name} logo`). Admin tables use `alt=""` (`AdminStallionTable.tsx`, `AdminBreederTable.tsx`) |
| Heading hierarchy | **PASS** | Single `<h1>` per major page (horse listing, stallion, breeder, marketplace browse, seller dashboard, etc.) |
| Focus / keyboard | **WARNING** | Not systematically audited; custom modals/galleries not verified for trap/focus return |
| Color contrast | **WARNING** | Dark theme (`#081223` / gray-400 text) — not verified against WCAG ratios in this audit |
| Error announcements | **WARNING** | `FavoriteButton` fails silently on error; some form errors are visual-only |

---

## 8. Security

**Category verdict: WARNING**

| Check | Verdict | Evidence |
|-------|---------|----------|
| Auth redirects | **WARNING** | Callback validates `next` (`getSafeNextPath`). **Login form does not** — `router.push(nextPath)` with raw `?next=` param (`LoginForm.tsx` L22, L68) — open redirect risk |
| Private routes | **WARNING** | Proxy list incomplete; page-level + server-action + RLS provide defense in depth |
| Server actions auth | **PASS** | All 19 action modules use `"use server"`; mutations call `getUser()`; ownership checks on listings/stallions/inquiries |
| Input validation | **WARNING** | Manual validators (no Zod); `JSON.parse(payload) as Type` in listing/breeder/stallion actions — relies on downstream validation + RLS |
| No service role in app | **PASS** | Only anon key + public URL in client/server code |
| CSRF | **PASS** | Next.js server action origin verification (framework default) |
| RLS as DB gate | **PASS** | Strong when migrations applied; see Database §5 for gaps |
| Admin RBAC | **PASS** | `requireAdmin()` + layout check + `is_admin()` SQL function |
| Large body limit | **WARNING** | `serverActions.bodySizeLimit: "128mb"` — needed for media; increases DoS surface (mitigated by auth on uploads) |
| Password recovery | **FAIL** | Not implemented — account lockout without admin intervention |

### P0 security fixes before public beta

1. Validate `next` in `LoginForm.tsx` (reuse `getSafeNextPath` from auth callback).
2. Implement password reset flow.
3. Confirm migration **035** applied; fix `horse_trait_assessments_public` view regardless.

---

## 9. Build Validation

**Category verdict: PASS**

### Lint

```
npm run lint
```

| Result | Detail |
|--------|--------|
| **PASS** | 0 errors, 2 warnings (pre-existing) |

Warnings:
- `BreedingLabClient.tsx` — `useCallback` missing dependency `t`
- `ExercisePickerModal.tsx` — `useEffect` missing dependencies

### Build

```
npm run build
```

| Result | Detail |
|--------|--------|
| **PASS** | Next.js 16.2.10 — compiled in ~34s, TypeScript clean, 136 pages generated |

All entity routes present in build output:
- `/[locale]/horses/[slug]`
- `/[locale]/stallions/[id]`
- `/[locale]/breeders/[id]`
- `/robots.txt` (static)
- `/sitemap.xml` (dynamic)

---

## Beta Readiness Checklist

### Must fix before open beta

- [ ] Password reset flow
- [ ] Login open-redirect fix (`LoginForm.tsx`)
- [ ] Apply migration `035_security_hardening_before_beta.sql` in production Supabase
- [ ] Harden `horse_trait_assessments_public` view (verified filter + invoker security)

### Should fix before marketing non-English locales

- [ ] Translate `stallions.json` and `breeders.json` (de/fr/nl/es)
- [ ] Localize stallion and breeder detail page UI
- [ ] Locale-aware JSON-LD URLs

### Should fix for performance at scale

- [ ] Replace `loadPedigreeTree` N+1 with batched loader
- [ ] Dedupe listing fetch between `generateMetadata` and page component
- [ ] Reduce home page listing fetch (100 → paginated server-side)
- [ ] Expand proxy `protectedRoutes` to include `/favorites`, `/training`, `/notifications`

### Nice to have

- [ ] Stallion JSON-LD schema
- [ ] Favorite error feedback UI
- [ ] Rate-limit view count RPC
- [ ] Zod validation for FormData JSON payloads

---

## Audit Methodology

- **Code review:** Routes, server actions, i18n config, SEO libraries, Supabase migrations (001–035)
- **Automated checks:** Namespace file parity, `metadata.json` key parity, stallions/breeders translation diff
- **Build validation:** `npm run lint` + `npm run build` executed 2026-08-03
- **Not in scope:** Live browser E2E, axe/Lighthouse runs, production Supabase state verification, load testing

---

## Conclusion

EquiMaster Pro demonstrates **mature architecture** for a sport-horse marketplace beta: marketplace flows are complete, SEO infrastructure is strong, and database design is thoughtful with RLS throughout. The primary beta risks are **auth completeness** (no password reset, open redirect), **migration-dependent security** (035 + trait view), and **localization content gaps** on stallion/breeder surfaces. With P0 items addressed, the platform is suitable for a **limited beta** with English-primary users and verified Supabase configuration.

**Overall beta readiness: WARNING — proceed with P0 fixes and controlled rollout.**
