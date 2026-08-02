/**
 * Apply migration 021 in ordered sections; stop at the first SQL error.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[PASSWORD]@...:6543/postgres"
 *   node scripts/apply-021-stepwise.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "021_training_plan_structure.sql"
);

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL.");
  process.exit(1);
}

const migrationSql = readFileSync(migrationPath, "utf8");

/** Split 021 into sections that can fail independently for clearer diagnostics. */
const sections = [
  {
    name: "1_prerequisites",
    sql: `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('training_plans', 'exercises')
      order by table_name;
    `,
    validate: (rows) => {
      const names = rows.map((r) => r.table_name);
      const missing = ["training_plans", "exercises"].filter((t) => !names.includes(t));
      if (missing.length > 0) {
        throw new Error(
          `Missing prerequisite tables: ${missing.join(", ")}. Apply migration 020 first.`
        );
      }
    },
  },
  {
    name: "2_prerequisite_functions",
    sql: `
      select p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('is_admin', 'can_use_exercise_in_training')
      order by p.proname;
    `,
    validate: (rows) => {
      const names = rows.map((r) => r.proname);
      const missing = ["is_admin", "can_use_exercise_in_training"].filter(
        (f) => !names.includes(f)
      );
      if (missing.length > 0) {
        throw new Error(
          `Missing prerequisite functions: ${missing.join(", ")}. Apply migration 020 (and platform admin helpers) first.`
        );
      }
    },
  },
  {
    name: "3_training_plan_weeks",
    sql: extractBlock(migrationSql, "-- training_plan_weeks", "-- training_plan_days"),
  },
  {
    name: "4_training_plan_days",
    sql: extractBlock(migrationSql, "-- training_plan_days", "-- training_plan_exercises"),
  },
  {
    name: "5_training_plan_exercises",
    sql: extractBlock(migrationSql, "-- training_plan_exercises", "-- Ownership helpers"),
  },
  {
    name: "6_ownership_helpers",
    sql: extractBlock(migrationSql, "-- Ownership helpers", "-- updated_at triggers"),
  },
  {
    name: "7_updated_at_triggers",
    sql: extractBlock(migrationSql, "-- updated_at triggers", "-- Integrity triggers"),
  },
  {
    name: "8_integrity_triggers",
    sql: extractBlock(migrationSql, "-- Integrity triggers", "-- Row level security"),
  },
  {
    name: "9_rls_and_grants",
    sql: extractBlock(migrationSql, "-- Row level security", null),
  },
];

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Could not find section marker: ${startMarker}`);
  }

  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : -1;
  const block = end === -1 ? source.slice(start) : source.slice(start, end);
  return block.trim();
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const section of sections) {
      process.stdout.write(`Running ${section.name} ... `);

      try {
        const result = await client.query(section.sql);
        if (section.validate) {
          section.validate(result.rows);
        }
        console.log("OK");
      } catch (error) {
        console.log("FAILED");
        console.error("\n--- FIRST ERROR ---");
        console.error(`Section: ${section.name}`);
        console.error(error.message);
        if (error.position) {
          console.error(`Position: ${error.position}`);
        }
        if (error.detail) {
          console.error(`Detail: ${error.detail}`);
        }
        if (error.hint) {
          console.error(`Hint: ${error.hint}`);
        }
        process.exit(1);
      }
    }

    const verify = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'training_plan_weeks',
          'training_plan_days',
          'training_plan_exercises'
        )
      order by table_name;
    `);

    console.log("\nCreated tables:");
    for (const row of verify.rows) {
      console.log(`  - ${row.table_name}`);
    }

    if (verify.rows.length !== 3) {
      console.error("\nMigration incomplete: expected 3 structure tables.");
      process.exit(1);
    }

    console.log("\nMigration 021 applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
