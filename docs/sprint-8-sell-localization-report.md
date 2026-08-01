# Sprint 8 — Localization Batch Report: `sell.json`

**Date:** 1 August 2026  
**Namespace:** `sell`  
**Locales:** en, de, fr, nl, es  
**Status:** Complete

---

## Summary

The `sell.json` namespace (horse listing creation flow) is fully localized across all five locales. All 141 translation keys are present, all keys referenced by sell components resolve at runtime, and the production build passes.

---

## Files changed

| File | Action |
|------|--------|
| `messages/de/sell.json` | Full localization (was 100% English placeholder) |
| `messages/fr/sell.json` | Full localization (was 100% English placeholder) |
| `messages/nl/sell.json` | Full localization (was 100% English placeholder) |
| `messages/es/sell.json` | Full localization (was 100% English placeholder) |
| `messages/en/sell.json` | Unchanged (source of truth, 141 keys) |

No component, routing, or business-logic files were modified.

---

## Keys added

**0** — No new keys were introduced. All locales mirror the existing EN key structure.

---

## Keys removed

**0** — No keys were removed. Static analysis confirms all 141 defined keys are referenced by sell UI components:

- `app/[locale]/sell/page.tsx`
- `app/components/sell/*` (13 components)

---

## Missing translations

### Cross-locale key parity

| Locale | Keys | Missing vs EN | Extra vs EN |
|--------|------|---------------|-------------|
| en | 141 | — | — |
| de | 141 | 0 | 0 |
| fr | 141 | 0 | 0 |
| nl | 141 | 0 | 0 |
| es | 141 | 0 | 0 |

### Static i18n audit (`scripts/audit-i18n-keys.mjs`)

- **Missing unique keys (all namespaces):** 0
- **Missing locale entries:** 0
- **No `sell.*` keys flagged**

### Strings identical to English (intentional, not missing)

| Locale | Count | Examples |
|--------|-------|----------|
| de | 11 | `page.eyebrow`, example placeholders, `{height} cm`, `Video`, `Name` |
| fr | 15 | Above + `Discipline`, `Pedigree`, `Description` (loanwords) |
| nl | 13 | Above + `Discipline`, `Media`, `Video` |
| es | 11 | Above + `Pedigree` |

These are brand names, sample data, units, URLs, or established equestrian loanwords — not untranslated UI copy.

---

## Inconsistent wording

Cross-namespace terminology checks passed:

| Term | DE | FR | NL | ES | Aligned with |
|------|----|----|----|-----|--------------|
| Price on request | Preis auf Anfrage | Prix sur demande | Prijs op aanvraag | Precio a consultar | `common.priceOnRequest` |
| Pedigree section | Abstammung | Pedigree | Stamboek | Pedigree | `horse.pedigree.title` |
| Gender (mare) | Stute | Jument | Merrie | Yegua | `home.search.mare` |
| Seller dashboard | Verkäufer-Dashboard | Espace vendeur | Verkopersdashboard | Panel del vendedor | `nav.sellerDashboard` |
| Height label | Größe | Taille | Schofthoogte | Altura | `marketplace` / `horse` |
| Coat color | Farbe | Robe | Kleur | Capa | `horse.info.color` |

No inconsistencies requiring key renames or component changes.

---

## Runtime issues

- **`MISSING_MESSAGE` errors:** None expected — all statically referenced `sell.*` keys exist in all five locale files.
- **Dynamic key usage:** No dynamic `t(\`…\`)` patterns in sell components; all keys are static strings.
- **Manual smoke-test recommendation:** Visit `/de/sell`, `/fr/sell`, `/nl/sell`, `/es/sell` and step through form → preview → draft save to confirm ICU placeholders (`{count}`, `{name}`, `{price}`, `{current}/{max}`) render correctly.

---

## Build result

```
npm run build
```

**Result:** Passed (exit code 0)  
**Next.js:** 16.2.10 (Turbopack)  
**TypeScript:** Passed

---

## Next namespace (not started)

Per sprint instructions, work stops here. Recommended next batch: `auth.json`.
