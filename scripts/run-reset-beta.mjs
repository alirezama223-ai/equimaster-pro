#!/usr/bin/env node
/**
 * Run scripts/reset-beta.sql against the linked Supabase Postgres database.
 * Uses SUPABASE_DB_URL or DATABASE_URL; swaps ROLLBACK → COMMIT before execute.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[PASSWORD]@...:6543/postgres"
 *   node scripts/run-reset-beta.mjs
 *
 * Optional:
 *   --dry-run   Execute with ROLLBACK (default SQL ending unchanged)
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL or DATABASE_URL.\n" +
      "Add the Session pooler URI from Supabase Dashboard → Connect → Database."
  );
  process.exit(1);
}

let sql = readFileSync(join(__dirname, "reset-beta.sql"), "utf8");

if (!dryRun) {
  sql = sql
    .replace(/^ROLLBACK;\s*$/m, "-- ROLLBACK; (replaced by runner)")
    .replace(/^-- COMMIT;\s*$/m, "COMMIT;");
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log(dryRun ? "Running reset-beta.sql (dry-run / ROLLBACK)..." : "Running reset-beta.sql with COMMIT...");
  await client.query(sql);
  console.log(dryRun ? "Dry-run complete (changes rolled back)." : "Reset committed successfully.");
} catch (err) {
  console.error("Reset failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
