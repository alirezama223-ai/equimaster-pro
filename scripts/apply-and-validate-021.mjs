/**
 * Apply migration 021 and run validation queries.
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
 *   node scripts/apply-and-validate-021.mjs
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

const validationQueries = [
  {
    name: "structure_tables_exist",
    sql: `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'training_plan_weeks',
          'training_plan_days',
          'training_plan_exercises'
        )
      order by table_name;
    `,
    expect: (rows) =>
      rows.length === 3 &&
      rows.map((r) => r.table_name).join(",") ===
        "training_plan_days,training_plan_exercises,training_plan_weeks",
  },
  {
    name: "can_manage_training_plan_exists",
    sql: `
      select proname
      from pg_proc
      join pg_namespace n on n.oid = pg_proc.pronamespace
      where n.nspname = 'public'
        and proname = 'can_manage_training_plan';
    `,
    expect: (rows) => rows.length >= 1,
  },
  {
    name: "structure_rls_enabled",
    sql: `
      select relname, relrowsecurity
      from pg_class
      where relnamespace = 'public'::regnamespace
        and relname in (
          'training_plan_weeks',
          'training_plan_days',
          'training_plan_exercises'
        )
      order by relname;
    `,
    expect: (rows) => rows.length === 3 && rows.every((r) => r.relrowsecurity === true),
  },
  {
    name: "week_integrity_trigger",
    sql: `
      select tgname
      from pg_trigger
      where tgname = 'training_plan_weeks_enforce_integrity'
        and not tgisinternal;
    `,
    expect: (rows) => rows.length === 1,
  },
];

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const prereq = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('training_plans', 'exercises')
      order by table_name;
    `);

    if (prereq.rows.length < 2) {
      console.error(
        "Missing prerequisites. Apply migration 020 first (training_plans and exercises required)."
      );
      console.error("Found:", prereq.rows.map((r) => r.table_name).join(", ") || "none");
      process.exit(1);
    }

    console.log("Applying migration 021_training_plan_structure.sql ...");
    await client.query(migrationSql);
    console.log("Migration applied successfully.\n");

    console.log("Running validation queries ...\n");
    let passed = 0;

    for (const check of validationQueries) {
      const result = await client.query(check.sql);
      const ok = check.expect(result.rows);
      console.log(`${ok ? "PASS" : "FAIL"}  ${check.name}`);
      if (!ok) {
        console.log(JSON.stringify(result.rows, null, 2));
      } else {
        passed += 1;
      }
    }

    console.log(`\nValidation summary: ${passed}/${validationQueries.length} passed`);
    if (passed !== validationQueries.length) {
      process.exitCode = 1;
    } else {
      console.log(
        "\nNext step: apply 022_training_plan_persistence.sql if save_training_plan_structure is not defined yet."
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
