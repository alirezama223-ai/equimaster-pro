# EquiMaster Marketplace MVP (Sprint 029.2)

Production-ready marketplace flow: seller publishes a horse, buyer views it without login.

## Routes

| Route | Purpose |
|-------|---------|
| `/marketplace` | Marketplace home — featured, newest, search, browse |
| `/horses` | Full search & filter browse |
| `/horses/[slug]` | Public listing page (SEO URL) |
| `/sell` | Create listing |
| `/dashboard/seller` | Seller dashboard |
| `/dashboard/seller/listings/[id]/preview` | Listing preview + publish |
| `/dashboard/seller/listings/[id]/edit` | Edit listing |
| `/horse/[id]` | Legacy redirect → `/horses/[slug]` |

## Seller workflow

1. **Create horse data** via `/sell` (syncs to `pedigree_horses` as `pedigree_horse_id`)
2. **Preview** at `/dashboard/seller/listings/[id]/preview`
3. **Publish** — sets `status = active`, captures training/health snapshots
4. **Public URL** — `/horses/{slug}` (shareable, no login required)

### Listing actions

- Publish / Unpublish
- Mark as sold
- Archive
- Delete

## Architecture

- **`pedigree_horse_id`** is the canonical horse reference (`horse_id`)
- Horse attributes displayed from pedigree when linked
- Listing stores marketplace fields: price, media, seller contact, status, slug, snapshots
- **`public_training_summary`** / **`public_health_summary`** — captured at publish from existing training & health modules
- **`view_count`** — incremented on public page views (migration 030)

## Migrations

Apply in order:

1. `029_marketplace_core.sql` — slug, search vector, indexes
2. `030_marketplace_mvp.sql` — view count, public snapshots, RPC

## Definition of done

- [x] Seller creates listing linked to pedigree horse
- [x] Preview before publish
- [x] Publish produces public slug URL
- [x] Visitor opens `/horses/[slug]` without login
- [x] Training & health summaries on public page
- [x] Seller dashboard with stats, inquiries, favorites, views
- [x] Responsive UI, SEO + OpenGraph
- [x] No mock data on marketplace surfaces
