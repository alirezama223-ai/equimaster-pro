#!/usr/bin/env node
/**
 * Read-only migration audit for EquiMaster Pro.
 * Verifies file order, duplicates, and canonical greenfield path.
 *
 * Usage: node scripts/verify-migrations.mjs
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const CANONICAL_GREENFIELD = [
  ...Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(3, "0")),
  "029",
  "030",
  "035",
];

const REPAIR_ONLY = new Set(["031", "032", "033", "034"]);
const DUPLICATE_SUFFIX = new Set(["002", "011", "022a"]);

const functionNames = new Map();
const issues = [];

for (const file of files) {
  const content = readFileSync(join(migrationsDir, file), "utf8");

  for (const match of content.matchAll(
    /create or replace function public\.(\w+)/gi
  )) {
    const fn = match[1];
    if (!functionNames.has(fn)) {
      functionNames.set(fn, []);
    }
    functionNames.get(fn).push(file);
  }

  if (content.includes("search_vector") && !file.includes("035")) {
    if (file.startsWith("033") || file.startsWith("034")) {
      if (!content.includes("horse_listings_search_vector")) {
        issues.push(`${file}: mentions search_vector but lacks search_vector functions`);
      }
    }
  }
}

console.log("=== Migration file order ===");
console.log(files.map((f) => `  ${f}`).join("\n"));
console.log(`\nTotal: ${files.length} migrations\n`);

console.log("=== Duplicate function definitions (may be idempotent) ===");
for (const [fn, defs] of functionNames) {
  if (defs.length > 1) {
    console.log(`  ${fn}: ${defs.join(", ")}`);
  }
}

console.log("\n=== Canonical greenfield path ===");
console.log(
  CANONICAL_GREENFIELD.map((n) => {
    const match = files.find((f) => f.startsWith(n + "_") || f.startsWith(n.padStart(3, "0") + "_"));
    return match ? `  ✓ ${match}` : `  ✗ MISSING ${n}`;
  }).join("\n")
);

console.log("\n=== Repair-only migrations (skip on greenfield after 029+030) ===");
for (const file of files) {
  const num = file.match(/^(\d+)/)?.[1];
  if (REPAIR_ONLY.has(num)) {
    console.log(`  ${file}`);
  }
}

console.log("\n=== Known harmless duplicates ===");
for (const file of files) {
  const num = file.match(/^(\d+[a-z]?)_/)?.[1];
  if (DUPLICATE_SUFFIX.has(num)) {
    console.log(`  ${file}`);
  }
}

console.log("\n=== Audit issues ===");
if (issues.length === 0) {
  console.log("  None detected by static analysis.");
} else {
  issues.forEach((i) => console.log(`  ${i}`));
}

const missing = CANONICAL_GREENFIELD.filter((n) => {
  const padded = n.padStart(3, "0");
  return !files.some((f) => f.startsWith(`${padded}_`) || f.startsWith(`${n}_`));
});

process.exit(missing.length > 0 ? 1 : 0);
