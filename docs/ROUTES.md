# EquiMaster Pro — Route Map

Generated for **v1.0 RC1**. Source of truth: every `app/**/page.tsx` file (34 routes) plus one auth handler route.

## Verification summary

| Check | Result | Notes |
|-------|--------|-------|
| **Orphan routes** | ✅ None | Every page has ≥1 inbound link, redirect target, or nav entry |
| **Duplicate routes** | ✅ None | Route groups `(session)`, `(create)`, `(editor)` do not affect URLs; one `page.tsx` per URL pattern |
| **Unreachable routes** | ✅ None | All routes are navigable (some require auth, admin, or horse-management access) |

### Route groups (URL-transparent)

Next.js route groups in parentheses are **not** part of the public URL:

| File path | Public URL |
|-----------|------------|
| `app/training/(session)/session/[id]/page.tsx` | `/training/session/[id]` |
| `app/training/plans/(create)/new/page.tsx` | `/training/plans/new` |
| `app/training/plans/(editor)/[id]/page.tsx` | `/training/plans/[id]` |

### Non-page route handler

| File | URL | Purpose |
|------|-----|---------|
| `app/auth/callback/route.ts` | `/auth/callback` | Supabase OAuth / magic-link callback |

---

## Complete route inventory

### Marketplace & auth

| URL | File | Auth | Inbound navigation |
|-----|------|------|-------------------|
| `/` | `app/page.tsx` | Public | Navbar Home, logout redirect |
| `/login` | `app/login/page.tsx` | Public | NavbarAuthControls, auth redirects |
| `/signup` | `app/signup/page.tsx` | Public | NavbarAuthControls |
| `/sell` | `app/sell/page.tsx` | Public | Navbar CTA, nav menu, AccountDashboard |
| `/favorites` | `app/favorites/page.tsx` | Auth | Navbar (desktop + menu) |
| `/horse/[id]` | `app/horse/[id]/page.tsx` | Public | Home cards, favorites, account listings, inquiries, pedigree links |
| `/horse/[id]/edit` | `app/horse/[id]/edit/page.tsx` | Owner | Account → My Listings |
| `/account` | `app/account/page.tsx` | Auth | NavbarAuthControls |

### Breeders & stallions

| URL | File | Auth | Inbound navigation |
|-----|------|------|-------------------|
| `/breeders` | `app/breeders/page.tsx` | Public | Navbar |
| `/breeders/[id]` | `app/breeders/[id]/page.tsx` | Public | BreederCard, stallion pages, account, admin tables |
| `/stallions` | `app/stallions/page.tsx` | Public | Navbar, PremiumStallions, recommendations |
| `/stallions/[id]` | `app/stallions/[id]/page.tsx` | Public | StallionCard, recommendations, pedigree links, account |

### Pedigree & breeding

| URL | File | Auth | Inbound navigation |
|-----|------|------|-------------------|
| `/bloodlines` | `app/bloodlines/page.tsx` | Public | Navbar, pedigree back link |
| `/pedigree/[id]` | `app/pedigree/[id]/page.tsx` | Public | Bloodlines search, breeding lab, admin, PedigreeTree links |
| `/pedigree/[id]/traits` | `app/pedigree/[id]/traits/page.tsx` | Manage | Pedigree page (canManage), stallion page |
| `/pedigree/[id]/analytics` | `app/pedigree/[id]/analytics/page.tsx` | Manage | Pedigree page |
| `/pedigree/[id]/health` | `app/pedigree/[id]/health/page.tsx` | Manage | Pedigree page |
| `/pedigree/[id]/timeline` | `app/pedigree/[id]/timeline/page.tsx` | Manage | Pedigree page |
| `/breeding-lab` | `app/breeding-lab/page.tsx` | Public* | Navbar, pedigree, stallions, recommendations |
| `/breeding-recommendations` | `app/breeding-recommendations/page.tsx` | Public | Navbar ("Stallion Match") |

\*Breeding Lab shows login prompt for saved analyses when unauthenticated; page itself loads.

### Daily training

| URL | File | Auth | Inbound navigation |
|-----|------|------|-------------------|
| `/training` | `app/training/page.tsx` | Auth | Navbar, session finish, plan headers |
| `/training/session/[id]` | `app/training/(session)/session/[id]/page.tsx` | Auth | Start Session → `trainingSessionPath()` |
| `/training/plans` | `app/training/plans/page.tsx` | Auth | TrainingDashboardHeader |
| `/training/plans/new` | `app/training/plans/page.tsx` → create | Auth | TrainingPlansClient |
| `/training/plans/[id]` | `app/training/plans/(editor)/[id]/page.tsx` | Auth | PlanCard, create form redirect |
| `/training/analytics` | `app/training/analytics/page.tsx` | Auth | TrainingDashboardHeader |
| `/training/health` | `app/training/health/page.tsx` | Auth | TrainingDashboardHeader |
| `/training/timeline` | `app/training/timeline/page.tsx` | Auth | TrainingDashboardHeader |

### Events

| URL | File | Auth | Inbound navigation |
|-----|------|------|-------------------|
| `/notifications` | `app/notifications/page.tsx` | Auth | NotificationBell (navbar), TodaysAlertsWidget |

### Admin

All `/admin/*` pages inherit auth + `is_admin()` gate from `app/admin/layout.tsx`.

| URL | File | Inbound navigation |
|-----|------|-------------------|
| `/admin` | `app/admin/page.tsx` | NavbarAuthControls (admin users), AdminNav |
| `/admin/breeders` | `app/admin/breeders/page.tsx` | AdminNav, AdminStatsGrid |
| `/admin/stallions` | `app/admin/stallions/page.tsx` | AdminNav, AdminStatsGrid |
| `/admin/pedigree` | `app/admin/pedigree/page.tsx` | AdminNav, AdminStatsGrid |
| `/admin/traits` | `app/admin/traits/page.tsx` | AdminNav |

---

## Auth & access gates

| Gate | Routes affected | Behavior |
|------|-----------------|----------|
| **Public** | `/`, `/login`, `/signup`, `/sell`, listings, breeders, stallions, bloodlines, pedigree view, breeding pages | No login required |
| **Auth** | `/training/*`, `/favorites`, `/account`, `/notifications`, `/horse/[id]/edit` | Redirect to `/login?next=…` |
| **Admin** | `/admin/*` | Layout redirects non-admin to `/account` |
| **Manage** | `/pedigree/[id]/traits`, `/analytics`, `/health`, `/timeline` | Redirect to `/pedigree/[id]` if `!canManage` |

---

## Dynamic segment conventions

| Segment | Format | Example |
|---------|--------|---------|
| `[id]` (horse listing) | UUID or legacy numeric slug | `/horse/550e8400-…` |
| `[id]` (pedigree) | UUID (`pedigree_horses.id`) | `/pedigree/550e8400-…` |
| `[id]` (session) | UUID | `/training/session/550e8400-…` |
| `[id]` (plan editor) | UUID | `/training/plans/550e8400-…` |
| `[id]` (breeder/stallion) | UUID | `/breeders/550e8400-…` |

Canonical session path helper: `trainingSessionPath(id)` → `/training/session/${id}` (`app/lib/training/routes.ts`).

---

## Navigation index

### Primary navbar (`navLinks.ts`)

| Label | Route |
|-------|-------|
| Home | `/` |
| Favorites | `/favorites` |
| Stallions | `/stallions` |
| Breeders | `/breeders` |
| Bloodlines | `/bloodlines` |
| Breeding Lab | `/breeding-lab` |
| Training | `/training` |
| Stallion Match | `/breeding-recommendations` |
| Sell a Horse (CTA) | `/sell` |

### Secondary / contextual (not in main nav)

| Route | Entry points |
|-------|--------------|
| `/notifications` | Notification bell |
| `/training/analytics` | Training dashboard header |
| `/training/health` | Training dashboard header |
| `/training/timeline` | Training dashboard header |
| `/training/plans` | Training dashboard header |
| `/account` | Navbar auth menu |
| `/admin` | Navbar auth menu (admins) |
| `/pedigree/[id]/*` | Bloodlines, breeding tools, admin tables |
| `/horse/[id]/edit` | Account listings |

### Placeholder links (not routes)

Navbar includes `href="#"` for **Browse** and **About** — these are not pages.

---

## Query parameters (common)

| Route | Params | Purpose |
|-------|--------|---------|
| `/training` | `horseId` | Pre-select horse |
| `/training/analytics` | `horseId` | Pre-select horse |
| `/training/health` | `horseId` | Pre-select horse |
| `/training/timeline` | `horseId` | Pre-select horse |
| `/bloodlines` | `q`, `studbook`, `ueln` | Search filters |
| `/breeding-lab` | `mare`, `stallion`, `stallionDirectory`, `compare` | Prefill analysis |
| `/login`, `/signup` | `next` | Post-auth redirect |
| `/admin/breeders`, etc. | `filter` | Admin table filters |

---

## Audit methodology

1. **Discovery** — Glob all `app/**/page.tsx` (34 files).
2. **URL mapping** — Strip route groups; map dynamic `[param]` segments.
3. **Duplicate check** — Confirm no two files resolve to the same URL (build output verified 34 unique routes).
4. **Reachability** — Ripgrep `href=`, `redirect(`, `router.push/replace` across codebase; cross-reference navbar, admin nav, dashboard headers, and dynamic links.
5. **Orphan check** — Flag pages with zero inbound references; none found.

---

## Maintenance

When adding a route:

1. Create `app/<path>/page.tsx`
2. Add auth gate if needed (`redirect` or layout)
3. Link from navbar, a dashboard header, or a parent page
4. Update this file and `docs/DOMAIN_MAP.md`

Run `npm run build` to confirm the route appears in the build output table.
