# EquiMaster Pro v1.0 RC1 — Release Checklist

Target: **v1.0.0-rc1** — stability, consistency, and documentation. No new product features.

---

## Pre-release gates

### Build & quality

- [ ] `npm run lint` — zero errors (warnings documented below)
- [ ] `npm run build` — production build passes
- [ ] `npm run test` — Vitest suite passes
- [ ] Manual smoke test on `npm run dev` (port 3000)

### Database

- [ ] All migrations **001–027** applied in Supabase SQL Editor (see `docs/DATABASE.md`)
- [ ] Verify `horse_training_summary` view returns data after sessions logged
- [ ] Verify RLS: second user cannot read another user's training/health/events
- [ ] Storage buckets exist (003, 004, 010)

### Environment

- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Production env vars set on hosting platform
- [ ] Supabase Auth redirect URLs include production domain + `/auth/callback`

---

## Route audit

| Area | Routes | Auth | Empty | Error | Loading |
|------|--------|------|-------|-------|---------|
| Marketplace | `/`, `/horse/*`, `/sell` | ✓ | partial | partial | inline |
| Training hub | `/training` | ✓ | ✓ | ✓ | ✓ |
| Session | `/training/session/[id]` | ✓ | ✓ | ✓ | ✓ |
| Plans | `/training/plans/*` | ✓ | ✓ | ✓ | ✓ |
| Analytics | `/training/analytics`, `/pedigree/[id]/analytics` | ✓ | ✓ | ✓ | ✓ |
| Health | `/training/health`, `/pedigree/[id]/health` | ✓ | ✓ | ✓ | ✓ |
| Events | `/notifications`, `/training/timeline` | ✓ | ✓ | ✓ | ✓ |
| Traits | `/pedigree/[id]/traits` | ✓ | ✓ | partial | partial |
| Breeding | `/breeding-lab`, `/breeding-recommendations` | ✓ | partial | partial | partial |
| Admin | `/admin/*` | admin | — | — | — |
| Auth | `/login`, `/signup` | public | — | ✓ | — |

**Gap (accepted for RC1):** No App Router `loading.tsx` / `error.tsx` boundaries. Dashboards use `Suspense` + component-level states. Consider adding route boundaries in v1.0 final.

---

## UI consistency audit

### Standard components (`app/components/shared/`)

| Component | Purpose | Used by |
|-----------|---------|---------|
| `DashboardCard` | Section container with loading skeleton | Training, health, analytics, events |
| `EmptyState` | Dashed border empty placeholder | All dashboards (via alias) |
| `ErrorState` | Red-bordered error message | All dashboards (via alias) |
| `LoadingState` | Centered loading text/spinner | Available for inline use |
| `EntityGallery` | Image gallery | Listing/breeder pages |

### Legacy aliases (backward compatible)

- `TrainingEmptyState` → re-exports `EmptyState`
- `TrainingErrorState` → re-exports `ErrorState`

### Design tokens

- Page background: `#081223`
- Card background: `#111827`
- Inner inputs/surfaces: `#08111F` / `#0f172a`
- Primary action: `bg-blue-600`
- Alert severity: red / amber / emerald / blue badges (events, rules)

---

## Dead code & duplicates (RC1 cleanup)

| Item | Status | Notes |
|------|--------|-------|
| `app/lib/training/plans/mock-editor.ts` | **Removed** | Unused mock plan data (237 lines) |
| `syncHorseEventsFromTrainingContext` | **Removed** | Unused export |
| `syncHorseEventsFromRuleContext` | **Removed** | Unused export |
| `OpenAIProvider` | Kept (stub) | Intentional future provider swap |
| `app/data/horses.ts` | Kept | Static demo listings merged on homepage — document, do not use in domain modules |
| `lib/training/analytics.ts` vs `horse-analytics.ts` | Kept | Different scope: dashboard aggregates vs full analytics + rules |
| `lib/training/rules/helpers` vs `lib/health/rules/helpers` | Kept | Domain-specific score thresholds |

---

## Query optimizations (RC1)

| Change | Location |
|--------|----------|
| Avoid duplicate health snapshot fetch on analytics sync | `syncHorseEventsFromAnalytics` accepts precomputed `healthEvaluation` |
| Parallel event publish after resolve step | `syncModuleEvents` uses `Promise.all` |
| Timeline no longer re-fetches full analytics before read | `getHorseEventTimeline` reads events directly; sync on training/analytics load |

---

## Manual smoke test script

1. **Auth** — Sign up, sign in, sign out
2. **Listing** — View home, open listing, favorite (auth)
3. **Training** — Select horse, start session, complete exercise, finish with reflection
4. **Analytics** — Open `/training/analytics`, verify readiness score + charts
5. **Health** — Log daily health check, add farrier visit
6. **Events** — Check Today's Alerts on training dashboard, open Notification Center, resolve an event
7. **Timeline** — Open `/training/timeline`, verify session + rule events appear
8. **Pedigree** — Open managed horse pedigree, traits, analytics, health, timeline links
9. **Plans** — List plans, open editor (if migrations 021–023 applied)

---

## Known warnings (non-blocking)

- `ExercisePickerModal.tsx` — exhaustive-deps warning (pre-existing)
- Homepage static demo horses in `app/data/horses.ts` alongside live listings

---

## Documentation deliverables

- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DOMAIN_MAP.md`
- [x] `docs/DATABASE.md`
- [x] `RELEASE_CHECKLIST.md`

---

## Version bump (on release tag)

```json
"version": "1.0.0-rc1"
```

Update `package.json` version when tagging RC1.

---

## Post-RC1 backlog (not in scope)

- App Router `loading.tsx` / `error.tsx` for all route segments
- Replace homepage static demo horses with empty state when no listings
- Implement `OpenAIProvider` or remove stub
- Consolidate severity badge helpers across events/health/rules
- Event sync debounce / background job (reduce analytics-path writes)
- E2E test suite (Playwright)
