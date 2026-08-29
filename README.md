# EquiMaster Pro

EquiMaster Pro is a multilingual sport-horse platform focused on horse discovery, pedigrees, breeding analysis, marketplace listings, and equestrian news and events.

## Highlights

- 🐎 Horse profiles, pedigree data, traits, and breeding workflows
- 🧬 Breeding-goal analysis and transparent trait scoring
- 🛒 Marketplace listings with favourites and advanced search
- 📰 News & Events hub with live FEI event discovery
- 📅 Saved events, calendar export (`.ics`), and local reminder preferences
- 🌍 Internationalized UI for English, German, French, Spanish, and Dutch
- 🔎 SEO metadata and structured Schema.org data
- 📱 Responsive experience for desktop and mobile

## Tech stack

- Next.js / React / TypeScript
- Tailwind CSS
- next-intl for localization
- Supabase for application data and authentication
- Vercel for deployment
- Vitest for automated tests

## Local development

### Requirements

- Node.js 22+
- npm
- A configured Supabase project and the required environment variables

### Setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Validation

Run the same checks used by CI before opening a pull request:

```bash
npx tsc --noEmit
npm run lint --if-present
npm test
npm run build
```

## Project structure

```text
app/
  [locale]/          Localized application routes
  actions/           Server actions and data access
  components/        UI components
  lib/               Domain logic and utilities
messages/             Translation dictionaries
public/               Static assets
```

## Production

The production application is deployed through Vercel. Keep secrets and environment-specific configuration in the deployment environment rather than committing them to the repository.

## Contributing

Keep changes focused, maintain type safety and localization parity, and make sure TypeScript, lint, tests, and production build checks pass before merging.
