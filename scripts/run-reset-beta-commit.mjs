#!/usr/bin/env node
/**
 * reset-beta.sql delete order via admin session (COMMIT per table).
 * Project: xejckyolhuurzsqnzohq
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!baseUrl || !secret || !anon) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const projectRef = new URL(baseUrl).hostname.split(".")[0];
const rest = `${baseUrl}/rest/v1`;
const adminHeaders = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

async function listUsers() {
  const res = await fetch(`${baseUrl}/auth/v1/admin/users?per_page=200`, {
    headers: adminHeaders,
  });
  if (!res.ok) throw new Error(`listUsers: ${res.status} ${await res.text()}`);
  return (await res.json()).users ?? [];
}

async function createSessionForEmail(email) {
  const linkRes = await fetch(`${baseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ type: "magiclink", email }),
  });
  if (!linkRes.ok) throw new Error(`generate_link: ${await linkRes.text()}`);
  const link = await linkRes.json();
  const verifyRes = await fetch(`${baseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: link.hashed_token }),
  });
  if (!verifyRes.ok) throw new Error(`verify: ${await verifyRes.text()}`);
  return (await verifyRes.json()).access_token;
}

async function findAdminAccessToken() {
  for (const user of await listUsers()) {
    if (!user.email) continue;
    try {
      const token = await createSessionForEmail(user.email);
      const profileRes = await fetch(
        `${rest}/profiles?select=role&user_id=eq.${user.id}`,
        { headers: { apikey: anon, Authorization: `Bearer ${token}` } }
      );
      if (!profileRes.ok) continue;
      const profiles = await profileRes.json();
      if (profiles[0]?.role === "admin") {
        return { token, email: user.email, userId: user.id };
      }
    } catch {
      /* try next user */
    }
  }
  return null;
}

function userHeaders(token, extra = {}) {
  return { apikey: anon, Authorization: `Bearer ${token}`, ...extra };
}

async function restCount(table, token, query = "select=id&limit=0") {
  const res = await fetch(`${rest}/${table}?${query}`, {
    headers: { ...userHeaders(token), Prefer: "count=exact" },
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) return { error: `${res.status} ${await res.text()}` };
  const range = res.headers.get("content-range") ?? "*/0";
  const count = range.includes("/") ? range.split("/")[1] : "?";
  return { count: count === "*" ? 0 : Number(count) };
}

async function restDelete(table, token, filter) {
  const res = await fetch(`${rest}/${table}?${filter}`, {
    method: "DELETE",
    headers: userHeaders(token, { Prefer: "return=minimal" }),
  });
  if (res.status === 404) return "skipped (missing)";
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return "ok";
}

async function restPatchAll(table, token, body) {
  const res = await fetch(`${rest}/${table}?id=not.is.null`, {
    method: "PATCH",
    headers: userHeaders(token, {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(body),
  });
  if (res.status === 404) return "skipped (missing)";
  if (!res.ok) throw new Error(`${table} patch: ${res.status} ${await res.text()}`);
  return "ok";
}

async function reassignOwnerAndDelete(table, ownerCol, adminId, token) {
  process.stdout.write(`  reassign ${table}.${ownerCol}... `);
  console.log(await restPatchAll(table, token, { [ownerCol]: adminId }));
  process.stdout.write(`  delete ${table}... `);
  console.log(await restDelete(table, token, `${ownerCol}=eq.${adminId}`));
}

const ADMIN_DELETE_STEPS = [
  ["training_session_exercises", "id=not.is.null"],
  ["training_sessions", "id=not.is.null"],
  ["training_plan_exercises", "id=not.is.null"],
  ["training_plan_days", "id=not.is.null"],
  ["training_plan_weeks", "id=not.is.null"],
  ["training_plan_assignments", "id=not.is.null"],
  ["training_plans", "id=not.is.null"],
  ["horse_health_checks", "id=not.is.null"],
  ["horse_injuries", "id=not.is.null"],
  ["horse_farrier_visits", "id=not.is.null"],
  ["horse_vet_visits", "id=not.is.null"],
  ["horse_vaccinations", "id=not.is.null"],
  ["horse_medications", "id=not.is.null"],
  ["horse_events", "id=not.is.null"],
  ["horse_trait_assessments", "id=not.is.null"],
  ["mare_breeding_goals", "id=not.is.null"],
  ["breeding_analyses", "id=not.is.null"],
  ["demo_user_state", "id=not.is.null"],
  ["exercises", "source=eq.user"],
];

const VERIFY = [
  "horse_listings",
  "breeders",
  "stallions",
  "inquiries",
  "favorites",
  "breeding_analyses",
  "training_sessions",
  "pedigree_horses",
];

console.log(`Project ref: ${projectRef}`);
console.log("Mode: COMMIT (admin REST — reset-beta.sql + pedigree_horses)");

const admin = await findAdminAccessToken();
if (!admin) {
  console.error("No admin session available.");
  process.exit(1);
}
console.log(`Admin: ${admin.email}`);

console.log("\n=== PRE-RESET ===");
for (const table of VERIFY) {
  const r = await restCount(table, admin.token);
  console.log(`${table.padEnd(20)} ${r.missing ? "MISSING" : r.error ?? r.count}`);
}

for (const [table, filter] of ADMIN_DELETE_STEPS) {
  process.stdout.write(`Deleting ${table}... `);
  try {
    console.log(await restDelete(table, admin.token, filter));
  } catch (err) {
    console.log("FAILED");
    console.error(err.message);
    process.exit(1);
  }
}

console.log("\nOwnership reassign + delete (marketplace):");
try {
  await reassignOwnerAndDelete("horse_listings", "user_id", admin.userId, admin.token);
  await reassignOwnerAndDelete("stallions", "owner_id", admin.userId, admin.token);
  await reassignOwnerAndDelete("breeders", "owner_id", admin.userId, admin.token);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

process.stdout.write("Deleting pedigree_horses... ");
try {
  console.log(await restDelete("pedigree_horses", admin.token, "id=not.is.null"));
} catch (err) {
  console.log("FAILED (may need SQL GRANT DELETE on pedigree_horses)");
  console.error(err.message);
}

console.log("\n=== VERIFICATION QUERY ===");
const verification = {};
for (const table of VERIFY) {
  const r = await restCount(table, admin.token);
  verification[table] = r.missing ? null : r.error ? "ERROR" : r.count;
  console.log(`${table}: ${verification[table]}`);
}
console.log("\nResult:", JSON.stringify(verification, null, 2));
