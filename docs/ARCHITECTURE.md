# EquiMaster Pro — Architecture

EquiMaster Pro is a Next.js 16 (App Router) application backed by Supabase (PostgreSQL, Auth, Storage). The codebase follows a **domain-driven layout**: UI routes and components sit in `app/`, business logic in `app/lib/`, server mutations in `app/actions/`, and shared types in `app/types/`.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Language | TypeScript (strict) |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Styling | Tailwind CSS 4, dark theme (`#081223` / `#111827`) |
| Testing | Vitest (lib unit tests) |

## High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│  app/ (Routes + Client/Server Components)                   │
│  page.tsx → Server Component (auth, data prefetch)          │
│  *Client.tsx → Client Component (forms, selectors, charts)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  app/actions/ (Server Actions — "use server")                 │
│  Auth gate → lib queries → revalidatePath                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  app/lib/ (Domain logic — no React)                          │
│  training/ · health/ · events/ · traits/ · breeding/ …       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Supabase (PostgreSQL + RLS + Storage)                        │
└─────────────────────────────────────────────────────────────┘
```

## Core architectural patterns

### 1. Horse identity

Managed horses are identified by **`pedigree_horse_id`** (UUID), not listing ID. Training, health, analytics, traits, and events all key off `pedigree_horses.id`.

### 2. Ownership and access

`app/lib/traits/access.ts` defines `canManageTraitAssessments()` and `getPedigreeHorseManagementContext()`. The same relationships gate training (via SQL `can_manage_pedigree_horse_training`) and health RLS:

- Pedigree creator
- Listing owner
- Stallion owner
- Breeder stud-farm owner (via linked stallions)

### 3. Server Actions as API boundary

All client → database writes go through `app/actions/*`. Actions:

1. Validate input (UUID checks, auth)
2. Call lib functions
3. Return structured `{ data, error }` (no thrown errors to client)

### 4. Rule engines (training + health)

Modular rule evaluation lives in:

- `app/lib/training/rules/` — Fatigue, Workload, Consistency, Recovery, Jumping Balance
- `app/lib/health/rules/` — Fever, Lameness, Farrier, Vaccination, Active Injury

Both produce structured insights/alerts. Training readiness merges with health via `combineReadinessScores()` (60% training / 40% health).

Provider pattern: `RuleEngineProvider` with `RuleBasedProvider` default; `OpenAIProvider` stub for future swap.

### 5. Event-driven cross-module bus (Sprint 028)

Modules **publish** to `horse_events` via `app/lib/events/event-service.ts` instead of creating ad-hoc notifications:

```
Training ──┐
Health   ──┼──► syncModuleEvents() ──► horse_events
Analytics──┤
Rule Engine┘
```

Future AI providers should consume `horse_events` rather than querying every domain table.

Dedupe keys (`dedupe_key` + `source_module`) keep sync idempotent: active conditions upsert; cleared conditions resolve.

### 6. UI composition

| Pattern | Location | Usage |
|---------|----------|--------|
| Page shell | `Navbar` + `main.pt-28` | All authenticated pages |
| Card layout | `DashboardCard` | Training, health, analytics, events |
| Empty state | `EmptyState` | No data placeholders |
| Error state | `ErrorState` | Action/query failures |
| Loading | `LoadingState` / `DashboardCard loading` | Async sections |
| Horse selector | `TrainingHorseSelector` | Multi-horse dashboards |

Legacy aliases `TrainingEmptyState` / `TrainingErrorState` re-export shared components.

### 7. Migrations

SQL migrations in `supabase/migrations/` are applied **manually** in Supabase SQL Editor (001 → 027). Code includes fallbacks when tables/columns are missing (graceful error messages referencing migration numbers).

### 8. Route groups

Training uses route groups for Turbopack stability:

- `app/training/(session)/session/[id]`
- `app/training/plans/(create)/new`
- `app/training/plans/(editor)/[id]`

## Directory map (lib)

| Path | Responsibility |
|------|----------------|
| `lib/supabase/` | Server/client Supabase clients, env |
| `lib/traits/` | Trait assessments, access control, validation |
| `lib/training/` | Sessions, plans, generator, analytics, rules |
| `lib/health/` | Health records, rules, snapshots |
| `lib/events/` | Event service, publishers, sync, queries |
| `lib/breeding/` | Pedigree analysis, linebreeding |
| `lib/breeding-recommendations/` | Mare/stallion matching engine |
| `lib/breeding-goals/` | Mare breeding goals analysis |
| `lib/pedigree.ts` | Pedigree graph operations |

## Data flow examples

### Daily training session

1. User selects horse on `/training`
2. `startTrainingSessionAction` → `ensureTodayTrainingSession` + exercise copy
3. Live session at `/training/session/[id]` tracks exercises
4. `finishTrainingSession` marks complete → publishes `SESSION_COMPLETED` event
5. Dashboard reload syncs rule engine events

### Horse readiness

1. `/training/analytics` loads `fetchHorseTrainingAnalytics`
2. Parallel fetch: summary view, ratings, load, exercises, notes, feelings
3. Rule engine + health rules → combined readiness score
4. `syncHorseEventsFromAnalytics` publishes rule/health/analytics events

## Environment

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## RC1 stability notes

- No `loading.tsx` / `error.tsx` route boundaries yet — dashboards use inline Suspense + component-level states
- Homepage merges static demo listings (`app/data/horses.ts`) with live Supabase listings for marketplace display
- Migrations 024–027 must be applied for full training session tracking, analytics, health, and events
