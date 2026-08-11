#!/usr/bin/env node
/**
 * EquiMaster Pro — controlled backfill for horse_listings coordinates (Phase D)
 *
 * Geocodes existing listings that have city/postal_code/country but missing lat/lng.
 * Does NOT run automatically. Preview by default.
 *
 * Usage:
 *   node scripts/backfill-listing-coordinates.mjs              Dry-run preview (default)
 *   node scripts/backfill-listing-coordinates.mjs --confirm    Apply updates
 *   node scripts/backfill-listing-coordinates.mjs --limit 10   Batch size (max 100)
 *
 * Environment (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GEOCODING_PROVIDER=nominatim|mapbox   (optional, default nominatim)
 *   MAPBOX_ACCESS_TOKEN                   (required for mapbox)
 *   GEOCODING_USER_AGENT                  (recommended for nominatim)
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const confirm = args.has("--confirm");
const limitArg = [...args].find((arg) => arg.startsWith("--limit="));
const limit = Math.min(
  Math.max(Number(limitArg?.split("=")[1] ?? 25) || 25, 1),
  100
);
const delayMs = 1_100;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildQuery(location) {
  const parts = [location.postal_code, location.city, location.country]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

async function geocodeLocation(location) {
  const query = buildQuery(location);
  if (!query) return null;

  const provider = (process.env.GEOCODING_PROVIDER || "nominatim").toLowerCase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    if (provider === "mapbox") {
      const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
      if (!token) {
        throw new Error("MAPBOX_ACCESS_TOKEN is required for mapbox geocoding.");
      }
      const params = new URLSearchParams({ access_token: token, limit: "1" });
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
        { signal: controller.signal, headers: { Accept: "application/json" } }
      );
      if (!response.ok) return null;
      const payload = await response.json();
      const center = payload.features?.[0]?.center;
      if (!center) return null;
      return { latitude: center[1], longitude: center[0] };
    }

    const params = new URLSearchParams({ q: query, format: "json", limit: "1" });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent":
            process.env.GEOCODING_USER_AGENT ||
            "EquiMaster-Pro/1.0 (listing coordinate backfill script)",
        },
      }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const first = payload[0];
    if (!first) return null;
    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch (error) {
    console.warn("Geocode failed:", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isCandidate(row) {
  return (
    row.country?.trim() &&
    (row.latitude == null || row.longitude == null) &&
    (row.city?.trim() || row.postal_code?.trim())
  );
}

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("horse_listings")
    .select("id, city, postal_code, country, latitude, longitude")
    .or("latitude.is.null,longitude.is.null")
    .not("country", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit * 4);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const candidates = (data ?? []).filter(isCandidate).slice(0, limit);
  console.log(
    confirm
      ? `Applying coordinate backfill for up to ${candidates.length} listing(s)...`
      : `Dry-run preview for up to ${candidates.length} listing(s)...`
  );

  let updated = 0;
  let failed = 0;

  for (const row of candidates) {
    const location = {
      city: row.city,
      postal_code: row.postal_code,
      country: row.country,
    };
    const coords = await geocodeLocation(location);

    if (!coords) {
      failed += 1;
      console.log(`  ✗ ${row.id} — geocoding failed (${buildQuery(location)})`);
      await sleep(delayMs);
      continue;
    }

    if (confirm) {
      const { error: updateError } = await supabase
        .from("horse_listings")
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq("id", row.id);

      if (updateError) {
        failed += 1;
        console.log(`  ✗ ${row.id} — update failed: ${updateError.message}`);
      } else {
        updated += 1;
        console.log(
          `  ✓ ${row.id} — ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
      }
    } else {
      updated += 1;
      console.log(
        `  ~ ${row.id} — would set ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      );
    }

    await sleep(delayMs);
  }

  console.log("");
  console.log(`Scanned: ${candidates.length}`);
  console.log(`${confirm ? "Updated" : "Would update"}: ${updated}`);
  console.log(`Failed: ${failed}`);
  if (!confirm) {
    console.log("\nRe-run with --confirm to apply updates.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
