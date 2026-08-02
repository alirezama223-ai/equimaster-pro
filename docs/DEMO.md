# EquiMaster Pro Demo Environment

Sprint 031 delivers a complete demonstration environment that uses the **real database schema and application workflows**—no mock UI components.

## Overview

The demo stable **EquiMaster Demo Stable** includes:

- Five sport horses with distinct training and health profiles
- Four organization personas (owner, trainer, vet, farrier)
- 30 days of completed training sessions, plans, health records, and synced events
- Analytics and rule-engine data designed so charts and recommendations are populated

## Prerequisites

1. Apply migrations **001–028** in Supabase (including `028_demo_infrastructure.sql`).
2. Ensure the **system exercise library** is seeded (`supabase/seeds/exercise_library_seed.sql`) so session exercises link to real catalog rows.
3. Sign in with any authenticated user account.

## Using the demo

### Account dashboard

Open **Account → Demo Environment** (`/account`):

| Control | Behavior |
|---------|----------|
| **Demo mode off → on** | Seeds five horses (first time) and shows demo horses across training modules |
| **Demo mode on → off** | Hides demo horses from horse pickers; data remains in the database |
| **Reset demo data** | Deletes prior demo entities for your user, re-seeds from scratch, and re-syncs events |

### Demo horses

| Horse | Discipline | Profile |
|-------|------------|---------|
| **Atlas** | Show Jumping | Primary analytics showcase; high workload, rich session history |
| **Bella** | Dressage | Consistent medium volume; positive rule-engine insights |
| **Comet** | Eventing | Fatigue signals and recovering injury |
| **Dawn** | Hunter | Lower session volume and readiness |
| **Echo** | Show Jumping | Overdue farrier/vaccination and active mild injury |

### Demo team (metadata)

| Role | Name |
|------|------|
| Owner | Sarah Mitchell |
| Trainer | James Carter |
| Veterinarian | Dr. Elena Voss |
| Farrier | Marcus Webb |

These are display personas stored in `demo_organization_members`; they are not separate auth users.

## What gets seeded

For each demo horse, the seed engine creates:

- `pedigree_horses` + draft `horse_listings` (linked via `pedigree_horse_id`)
- Active `training_plans` with `training_plan_assignments`
- Completed `training_sessions` with ratings, horse feelings, coach notes, and linked `training_session_exercises`
- Health records: daily checks, farrier visits, vaccinations, vet visits, injuries (profile-dependent)
- `horse_events` via `syncHorseEventsFromAnalytics` (rule engine, analytics, and health publishers)

Entity IDs are tracked per user in `demo_user_state` for safe cleanup on reset.

## Architecture

```
app/lib/demo/
  constants.ts      — horse templates and org slug
  helpers.ts        — date/session utilities
  preferences.ts    — demo_user_state read/write
  queries.ts        — organization + environment snapshot
  cleanup-demo.ts   — delete demo-tagged entities
  seed-demo.ts      — programmatic seed + event sync
  reset-demo.ts     — cleanup + seed orchestration

app/actions/demo.ts — server actions (getDemoEnvironmentSnapshot, setDemoMode, resetDemo)
```

### Database tables (migration 028)

- `demo_organizations` — singleton stable metadata
- `demo_organization_members` — owner / trainer / vet / farrier personas
- `demo_user_state` — per-user demo mode flag, seeded entity IDs, last reset timestamp

### Horse visibility

`fetchManageableTrainingHorses` filters out demo horse IDs when **demo mode is off**, so production horse lists stay clean while demo data persists for quick re-enable.

## Charts and rule engine

Demo seed data is tuned so analytics views are populated:

- **Atlas**: dense recent sessions → training load, rating trends, exercise frequency
- **Comet**: recent “Tired/Flat” feelings → fatigue rule insights
- **Echo / Comet**: health records → overdue care, lameness, and injury alerts
- **Bella**: steady rhythm → positive consistency/workload recommendations

Open `/training/analytics` with demo mode on and select **Atlas** for the fullest chart set.

## Reset behavior

Reset is **scoped to the current user**:

1. Removes tracked demo plans, listings, and pedigree horses (cascades sessions, health, events)
2. Re-inserts fresh seed data with new UUIDs
3. Updates `demo_user_state` and enables demo mode

Demo listings use `status = 'draft'` so they do not appear on the public marketplace.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Demo panel shows a database error | Apply migration `028_demo_infrastructure.sql` |
| Seed fails on exercises | Run `exercise_library_seed.sql` |
| Charts empty after seed | Run **Reset demo data**; verify system exercises exist |
| Demo horses still visible with mode off | Refresh the page; filtering applies in server queries |

## Related documentation

- [DATABASE.md](./DATABASE.md) — full schema reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) — training, health, events, and analytics flow
- [ROUTES.md](./ROUTES.md) — `/account`, `/training/*` routes
