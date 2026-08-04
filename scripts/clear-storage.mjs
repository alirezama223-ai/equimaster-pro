#!/usr/bin/env node
/**
 * EquiMaster Pro — Clear all objects from Supabase Storage buckets (RC1.1)
 *
 * Deletes every object in app storage buckets. Buckets themselves are kept.
 * No database changes.
 *
 * Buckets (from migrations 003, 004, 010):
 *   - horse-images
 *   - horse-videos
 *   - stallion-images
 *   - breeder-images
 *
 * Usage:
 *   node scripts/clear-storage.mjs              Preview: list object counts only
 *   node scripts/clear-storage.mjs --confirm    Delete all objects (requires flag)
 *
 * Environment (.env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL          — project URL (required)
 *   SUPABASE_SERVICE_ROLE_KEY         — service role key (required for list/remove)
 *
 * SAFETY:
 *   - Default mode is preview-only (no deletions).
 *   - Deletion requires explicit --confirm flag.
 *   - Run against staging before production.
 *   - Pair with scripts/reset-beta.sql for a full beta reset (DB + storage).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

/** All storage buckets used by EquiMaster Pro */
const BUCKETS = ["horse-images", "horse-videos", "stallion-images", "breeder-images"];

const LIST_PAGE_SIZE = 1000;
const REMOVE_BATCH_SIZE = 100;

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage:
  node scripts/clear-storage.mjs              Preview object counts (no deletion)
  node scripts/clear-storage.mjs --confirm    Delete all objects in all buckets

Environment:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
  process.exit(0);
}

const confirmDelete = args.has("--confirm");

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Storage admin list/remove requires the service role key.\n" +
      "Add it to .env.local (do not commit) or export it in your shell."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Recursively list all file paths in a bucket.
 * Folder entries from Supabase list() have id === null.
 */
async function listAllObjectPaths(bucket, prefix = "") {
  const paths = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`list failed for ${bucket}/${prefix || "(root)"}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (item.id === null) {
        const nested = await listAllObjectPaths(bucket, itemPath);
        paths.push(...nested);
      } else {
        paths.push(itemPath);
      }
    }

    if (data.length < LIST_PAGE_SIZE) {
      break;
    }

    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

async function countBucketObjects(bucket) {
  try {
    const paths = await listAllObjectPaths(bucket);
    return { bucket, count: paths.length, paths, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { bucket, count: 0, paths: [], error: message };
  }
}

async function deleteObjectPaths(bucket, paths) {
  let deleted = 0;

  for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
    const batch = paths.slice(i, i + REMOVE_BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(batch);

    if (error) {
      throw new Error(`remove failed for ${bucket}: ${error.message}`);
    }

    deleted += batch.length;
  }

  return deleted;
}

function printCounts(label, results) {
  console.log(`\n${label}`);
  console.log("-".repeat(48));

  let total = 0;

  for (const result of results) {
    if (result.error) {
      console.log(`  ${result.bucket.padEnd(20)} ERROR — ${result.error}`);
    } else {
      console.log(`  ${result.bucket.padEnd(20)} ${result.count} object(s)`);
      total += result.count;
    }
  }

  console.log("-".repeat(48));
  console.log(`  ${"TOTAL".padEnd(20)} ${total} object(s)\n`);
}

async function main() {
  console.log("EquiMaster Pro — Storage reset tool");
  console.log(`Mode: ${confirmDelete ? "DELETE (--confirm)" : "PREVIEW (no deletions)"}`);
  console.log(`URL:  ${supabaseUrl}`);
  console.log(`Buckets: ${BUCKETS.join(", ")}`);

  if (!confirmDelete) {
    console.log("\nPreview only. Pass --confirm to delete all objects.");
  } else {
    console.log("\nWARNING: --confirm set. All objects in listed buckets will be deleted.");
    console.log("Buckets themselves will be preserved.");
  }

  // --- Before counts ---
  const beforeResults = [];

  for (const bucket of BUCKETS) {
    process.stdout.write(`Scanning ${bucket}...`);
    const result = await countBucketObjects(bucket);
    beforeResults.push(result);
    process.stdout.write(` ${result.error ? "error" : `${result.count} object(s)`}\n`);
  }

  printCounts("BEFORE", beforeResults);

  const beforeErrors = beforeResults.filter((r) => r.error);
  if (beforeErrors.length > 0) {
    console.error("Aborting: one or more buckets could not be scanned.");
    process.exit(1);
  }

  if (!confirmDelete) {
    console.log("No objects deleted (preview mode).");
    console.log("To delete, run: node scripts/clear-storage.mjs --confirm");
    return;
  }

  // --- Deletion ---
  console.log("Deleting objects...\n");

  for (const result of beforeResults) {
    if (result.count === 0) {
      console.log(`  ${result.bucket}: nothing to delete`);
      continue;
    }

    process.stdout.write(`  ${result.bucket}: deleting ${result.count} object(s)...`);
    const deleted = await deleteObjectPaths(result.bucket, result.paths);
    process.stdout.write(` done (${deleted} removed)\n`);
  }

  // --- After counts ---
  const afterResults = [];

  for (const bucket of BUCKETS) {
    const result = await countBucketObjects(bucket);
    afterResults.push(result);
  }

  printCounts("AFTER", afterResults);

  const remaining = afterResults.reduce((sum, r) => sum + (r.error ? 0 : r.count), 0);

  if (remaining === 0) {
    console.log("All bucket objects cleared. Buckets preserved.");
  } else {
    console.warn(`WARNING: ${remaining} object(s) still remain. Re-run or inspect manually.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
