# Localization Quality Audit — EquiMaster Pro

**Date:** 11 July 2026  
**Scope:** User-facing copy in EN, DE, FR, NL, ES  
**Method:** Quality audit (naturalness, consistency, market terminology) — not a key-coverage audit  
**Constraint:** Translation keys unchanged; wording only

---

## Executive summary

Before this pass, **~93% of strings in DE/FR/NL/ES were identical to English** (~1,688 of 1,812 strings per locale). Most namespace files were English placeholders, not localized copy.

This audit prioritized **high-traffic buyer and seller journeys**:

| Namespace | User impact |
|-----------|-------------|
| `marketplace.json` | Browse, filters, seller dashboard, listing actions |
| `horse.json` | Listing detail, gallery, inquiry modal, pedigree |
| `home.json` | Landing hero, search, featured horses |
| `nav.json` | Global navigation, a11y labels |
| `common.json` | Shared UI chrome, price-on-request, gallery |
| `favorites.json` | Save/remove horse, empty state |

After updates, priority namespaces are **~95% localized** (4–7% intentionally shared with EN — units, brand, loanwords).

**Remaining work:** 17 secondary namespaces (`training`, `breeding`, `account`, `sell`, `auth`, `admin`, etc.) still contain English placeholders (~1,400 strings/locale).

---

## Terminology standards applied

Consistent premium equestrian marketplace vocabulary per market:

| Concept | EN | DE | FR | NL | ES |
|---------|----|----|----|----|-----|
| Sport horse | sport horse | Sportpferd | cheval de sport | sportpaard | caballo de deporte |
| Listing | listing | Inserat | annonce | advertentie | anuncio |
| Verified | verified | verifiziert | vérifié | geverifieerd | verificado |
| Price on request | price on request | Preis auf Anfrage | prix sur demande | prijs op aanvraag | precio a consultar |
| Mare / stallion / gelding | mare / stallion / gelding | Stute / Hengst / Wallach | jument / étalon / hongre | merrie / hengst / ruin | yegua / semental / castrado |
| Pedigree | pedigree | Abstammung | pedigree | stamboek | pedigree |
| Asking price | asking price | Verkaufspreis | prix demandé | vraagprijs | precio de venta |
| Seller dashboard | seller dashboard | Verkäufer-Dashboard | espace vendeur | verkopersdashboard | panel del vendedor |
| Height | height | Größe / Schofthoogte | taille | schofthoogte | altura |
| Color/coat | color | Farbe | robe | kleur | capa |

---

## Awkward or literal phrasing found and fixed

### German (DE)

| Key / area | Before (issue) | After (fix) | Reason |
|------------|----------------|-------------|--------|
| `home.hero.subtitle` | "elite Springpferde" | "Springpferde der Spitzenklasse" | Denglisch; unnatural adjective placement |
| `home.search.title` | "Finden Sie Ihr perfektes Pferd" | "Finden Sie Ihr ideales Pferd" | "perfektes" is calqued from EN "perfect" |
| `marketplace.*` (entire file) | English placeholders | Full DE copy | 222/225 strings were untranslated |
| `horse.info.askingPrice` | "Asking price" | "Verkaufspreis" | Standard DE marketplace term |
| `horse.pedigree.title` | "Pedigree" | "Abstammung" | DE equestrian convention |
| `common.or/and/none` | "or", "and", "None" | "oder", "und", "Keine" | Leftover English particles |
| `nav.openMenu/closeMenu` | English | "Menü öffnen/schließen" | a11y strings must be native |
| `favorites.*` | Full English | Full DE | Entire namespace was English |

### French (FR)

| Key / area | Before (issue) | After (fix) | Reason |
|------------|----------------|-------------|--------|
| `marketplace.browse.listingsFound` | English ICU | "1 annonce trouvée / # annonces trouvées" | Plural agreement |
| `marketplace.browse.color` | "Color" | "Robe" | FR equine term for coat color |
| `horse.info.color` | "Color" | "Robe" | Consistency with browse filters |
| `horse.description.fallback` | English template | Natural FR with "montabilité", "lignées" | Premium tone |
| `nav.sellAHorse` | "Sell a Horse" | "Déposer une annonce" | FR marketplace convention |
| `common.priceOnRequest` | (was OK in partial) | "Prix sur demande" | Confirmed standard phrasing |

**Intentionally kept in FR:** "Marketplace", "Discipline", "Pedigree" — widely used loanwords in FR equestrian commerce.

### Dutch (NL)

| Key / area | Before (issue) | After (fix) | Reason |
|------------|----------------|-------------|--------|
| `marketplace.browse.height` | "Height" | "Schofthoogte" | NL industry standard (not "hoogte") |
| `marketplace.browse.title` | English | "Sportpaarden te koop" | Natural NL listing headline |
| `horse.pedigree.title` | "Pedigree" | "Stamboek" | NL standard term |
| `nav.bloodlines` | "Bloodlines" | "Bloedlijnen" | Was English in nav |
| `common.priceOnRequest` | English | "Prijs op aanvraag" | Standard NL |

**Intentionally kept in NL:** "Discipline", "Training", "Status" — common in NL sport horse context.

### Spanish (ES)

| Key / area | Before (issue) | After (fix) | Reason |
|------------|----------------|-------------|--------|
| `marketplace.browse.color` | "Color" | "Capa" | ES equine coat term |
| `horse.info.askingPrice` | "Asking price" | "Precio de venta" | More natural than literal "precio solicitado" |
| `common.priceOnRequest` | English | "Precio a consultar" | Iberian marketplace standard |
| `horse.inquiry.email` | "Email" | "Correo electrónico" | Formal/premium tone for ES |
| `nav.sellAHorse` | "Sell a Horse" | "Publicar anuncio" | Action-oriented, native phrasing |

**Intentionally kept in ES:** "Marketplace", "Pedigree" — commonly used in ES sport horse sales.

### English (EN) — minor polish

| Key | Before | After | Reason |
|-----|--------|-------|--------|
| `marketplace.trainingSummary.avgRating` | "Avg rating" | "Average rating" | Premium UI; avoid abbreviations |

---

## Consistency notes

1. **Formal address:** DE uses *Sie*, FR uses *vous*, NL uses *u*, ES uses *usted* (via verb forms) in marketplace and inquiry flows — appropriate for a premium B2C marketplace.
2. **CTA arrows:** Kept `→` suffix on browse CTAs (`Ansehen →`, `Voir →`) for visual consistency with EN.
3. **Ellipsis:** Localized loading/search states use `…` (Unicode) instead of `...` where updated.
4. **Phone placeholders:** Locale-appropriate formats (+49, +33, +31, +34).
5. **"Marketplace" brand term:** Retained untranslated in FR/ES nav and breadcrumbs — common in European equine platforms; DE/NL use *Marktplatz/Marktplaats*.

---

## Files updated in this pass

```
messages/de/marketplace.json   (full rewrite)
messages/fr/marketplace.json   (full rewrite)
messages/nl/marketplace.json   (full rewrite)
messages/es/marketplace.json   (full rewrite)

messages/de/horse.json         (full rewrite)
messages/fr/horse.json         (full rewrite)
messages/nl/horse.json         (full rewrite)
messages/es/horse.json         (full rewrite)

messages/de/common.json        (completed partial)
messages/fr/common.json        (completed partial)
messages/nl/common.json        (completed partial)
messages/es/common.json        (completed partial)

messages/de/nav.json           (completed partial)
messages/fr/nav.json           (completed partial)
messages/nl/nav.json           (completed partial)
messages/es/nav.json           (completed partial)

messages/de/favorites.json     (full rewrite)
messages/fr/favorites.json     (full rewrite)
messages/nl/favorites.json     (full rewrite)
messages/es/favorites.json     (full rewrite)

messages/de/home.json          (2 phrasing fixes)
messages/en/marketplace.json   (1 EN polish)
```

`home.json` for FR/NL/ES was already well localized; no structural changes needed.

---

## Remaining identical strings (intentional)

In priority namespaces, ~19–30 strings per locale still match EN. These are acceptable:

- **Units:** `cm`, `{height} cm`, `{index} / {total}`
- **Brand/stats:** `EquiMaster Pro`, `15K+`, `1200+`, `28`
- **Loanwords:** `Marketplace`, `Discipline`, `Pedigree`, `Video`, `Status`, `Training`
- **Symbols:** `🐴`, `(optional)`, `Name` (DE: same spelling)

---

## Recommended next phase

Localize in order of user visibility:

1. `sell.json` — listing creation flow (141 strings × 4 locales)
2. `auth.json` + `account.json` — login, registration, profile (216 strings)
3. `breeders.json` + `stallions.json` + `bloodlines.json` — directory pages
4. `inquiries.json` + `notifications.json` — post-contact UX
5. `training.json` + `breeding.json` — largest namespaces (564 strings); lower buyer priority

Use the same terminology table above for consistency across phases.

---

## Verification

- All JSON files remain valid; keys unchanged vs `messages/en/`
- ICU plural patterns preserved (`{count, plural, ...}`)
- Interpolation placeholders preserved (`{name}`, `{seller}`, `{stable}`, etc.)

Run `npm run build` after each localization batch to catch malformed JSON or missing keys.
