# EquiMaster Pro — Domain Map

Maps product domains to routes, actions, lib modules, and database objects.

## Legend

- **Auth**: Requires signed-in user
- **Manage**: Requires horse management access (`canManageTraitAssessments`)
- **Public**: Accessible without auth (may show limited data)

---

## Marketplace

| Route | Auth | Components | Actions | Lib |
|-------|------|------------|---------|-----|
| `/` | Public | `HomeClient` | `horse-listings`, `favorites` | `horse-listings`, `horse-filters` |
| `/horse/[id]` | Public | Listing detail | `horse-listings`, `inquiries` | `listing-media`, `listing-validation` |
| `/horse/[id]/edit` | Owner | Edit form | `horse-listings` | `horse-image-storage`, `horse-video-storage` |
| `/sell` | Auth | Sell wizard | `horse-listings` | `listing-validation` |
| `/favorites` | Auth | `FavoritesClient` | `favorites` | — |

**Tables**: `horse_listings`, `favorites`, `inquiries`, `inquiry_messages`

---

## Breeders & Stallions

| Route | Auth | Actions | Lib |
|-------|------|---------|-----|
| `/breeders` | Public | `breeders` | `breeders`, `breeder-image-storage` |
| `/breeders/[id]` | Public | `breeders` | `breeders` |
| `/stallions` | Public | `stallions` | `stallions`, `stallion-image-storage` |
| `/stallions/[id]` | Public | `stallions` | `stallions` |

**Tables**: `breeders`, `stallions`

---

## Pedigree & Bloodlines

| Route | Auth | Actions | Lib |
|-------|------|---------|-----|
| `/pedigree/[id]` | Public | `pedigree` | `pedigree`, `pedigree-sync` |
| `/bloodlines` | Public | — | `breeding/*` |
| `/breeding-lab` | Auth | breeding actions | `breeding/analyze`, `breeding/linebreeding` |
| `/breeding-recommendations` | Auth | recommendations | `breeding-recommendations/*` |

**Tables**: `pedigree_horses`, `breeding_analyses`

---

## Traits & Breeding Goals

| Route | Auth | Actions | Lib |
|-------|------|---------|-----|
| `/pedigree/[id]/traits` | Manage | `traits` | `traits/access`, `traits/aggregate`, `traits/validation` |

**Tables**: `horse_trait_assessments`, `mare_breeding_goals`, view `horse_trait_assessments_public`

---

## Daily Training

| Route | Auth | Client | Actions | Lib |
|-------|------|--------|---------|-----|
| `/training` | Auth | `TrainingDashboardClient` | `training` | `training/queries`, `training/generator` |
| `/training/session/[id]` | Auth | `TrainingSessionClient` | `training` | `session-lifecycle`, `finish-session` |
| `/training/plans` | Auth | `TrainingPlansClient` | `training-plans` | `training/plans/*` |
| `/training/plans/new` | Auth | Plan create | `training-plans` | `training/plans/save-editor` |
| `/training/plans/[id]` | Auth | `TrainingPlanEditor` | `training-plans` | `training/plans/fetch-editor` |

**Tables**: `exercises`, `training_plans`, `training_plan_weeks`, `training_plan_days`, `training_plan_exercises`, `training_plan_assignments`, `training_sessions`, `training_session_exercises`

---

## Training Analytics & Readiness

| Route | Auth | Client | Actions | Lib |
|-------|------|--------|---------|-----|
| `/training/analytics` | Auth | `HorseAnalyticsDashboardClient` | `training-analytics` | `training/horse-analytics`, `training/rules` |
| `/pedigree/[id]/analytics` | Manage | same | same | same |

**Views**: `horse_training_summary`

---

## Health & Wellness

| Route | Auth | Client | Actions | Lib |
|-------|------|--------|---------|-----|
| `/training/health` | Auth | `HorseHealthDashboardClient` | `health` | `health/queries`, `health/rules` |
| `/pedigree/[id]/health` | Manage | same | same | same |

**Tables**: `horse_health_checks`, `horse_injuries`, `horse_farrier_visits`, `horse_vet_visits`, `horse_vaccinations`, `horse_medications`

---

## Event Engine

| Route | Auth | Client | Actions | Lib |
|-------|------|--------|---------|-----|
| `/notifications` | Auth | `NotificationCenterClient` | `events` | `events/queries`, `events/event-service` |
| `/training/timeline` | Auth | `HorseTimelineClient` | `events` | `events/queries`, `events/sync-horse-events` |
| `/pedigree/[id]/timeline` | Manage | same | same | same |

**Tables**: `horse_events`

**Widgets**: `TodaysAlertsWidget` (training dashboard), `NotificationBell` (navbar)

---

## Account & Admin

| Route | Auth | Notes |
|-------|------|-------|
| `/login`, `/signup` | Public | Supabase auth |
| `/account` | Auth | Profile |
| `/admin` | Admin | `is_admin()` gate |
| `/admin/breeders`, `/admin/stallions`, `/admin/pedigree`, `/admin/traits` | Admin | Verification workflows |

**Tables**: `profiles`

---

## Cross-cutting concerns

| Concern | Implementation |
|---------|----------------|
| Horse access | `lib/traits/access.ts` + SQL `can_manage_pedigree_horse_training` |
| Event publishing | `lib/events/publishers.ts` + `syncModuleEvents` |
| Readiness score | Training rules + health rules → `combineReadinessScores` |
| Types | `app/types/training.ts`, `training-analytics.ts`, `health.ts`, `events.ts`, `traits.ts` |

---

## Route inventory (34 pages)

```
/                           /login                      /signup
/sell                       /account                    /favorites
/horse/[id]                 /horse/[id]/edit
/breeders                   /breeders/[id]
/stallions                  /stallions/[id]
/bloodlines                 /breeding-lab               /breeding-recommendations
/pedigree/[id]              /pedigree/[id]/traits
/pedigree/[id]/analytics    /pedigree/[id]/health       /pedigree/[id]/timeline
/training                   /training/session/[id]
/training/plans             /training/plans/new         /training/plans/[id]
/training/analytics         /training/health            /training/timeline
/notifications
/admin                      /admin/breeders             /admin/stallions
/admin/pedigree             /admin/traits
/auth/callback
```

---

## Module → event type reference

| Source module | Event types |
|---------------|-------------|
| `rule_engine` | `HIGH_WORKLOAD`, `LOW_READINESS`, `FARRIER_DUE`, `VACCINATION_DUE`, `RECOVERY_RECOMMENDED` |
| `health` | `FEVER_DETECTED`, `LAMENESS_DETECTED`, `ACTIVE_INJURY`, `FARRIER_OVERDUE`, `VACCINATION_OVERDUE` |
| `training` | `SESSION_COMPLETED` |
| `analytics` | `READINESS_UPDATED` |
