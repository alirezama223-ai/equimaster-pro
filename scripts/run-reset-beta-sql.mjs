#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
  }
}
loadEnvLocal();

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const password =
  process.env.SUPABASE_DB_PASSWORD ||
  process.env.POSTGRES_PASSWORD ||
  process.env.DB_PASSWORD;

let connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString && password) {
  const hosts = [
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
  ];
  for (const cs of hosts) {
    const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.end();
      connectionString = cs;
      break;
    } catch {
      await client.end().catch(() => {});
    }
  }
}

if (!connectionString) {
  console.error("No Postgres connection available for pedigree_horses cleanup.");
  process.exit(2);
}

const sql = readFileSync(join(__dirname, "grant-and-reset-beta-commit.sql"), "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const res = await client.query(sql);
  const last = res[res.length - 1]?.rows?.[0] ?? res.rows?.[0];
  console.log("SQL reset complete.");
  if (last) console.log("Verification:", last);
} catch (err) {
  console.error("SQL failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
