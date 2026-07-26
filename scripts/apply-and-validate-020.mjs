/**
 * Apply migration 020 and run validation queries.
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
 *   node scripts/apply-and-validate-020.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, "..", "supabase", "migrations", "020_daily_training_foundation.sql");

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL.");
  process.exit(1);
}

const migrationSql = readFileSync(migrationPath, "utf8");

const validationQueries = [
  {
    name: "tables_exist",
    sql: `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'exercises',
          'training_plans',
          'training_sessions',
          'training_session_exercises'
        )
      order by table_name;
    `,
    expect: (rows) =>
      rows.length === 4 &&
      rows.map((r) => r.table_name).join(",") ===
        "exercises,training_plans,training_session_exercises,training_sessions",
  },
  {
    name: "training_plans_no_pedigree_horse_id",
    sql: `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'training_plans'
        and column_name = 'pedigree_horse_id';
    `,
    expect: (rows) => rows.length === 0,
  },
  {
    name: "session_ai_columns",
    sql: `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'training_sessions'
        and column_name in ('session_goal', 'energy_level', 'confidence')
      order by column_name;
    `,
    expect: (rows) =>
      rows.length === 3 &&
      rows.map((r) => r.column_name).join(",") === "confidence,energy_level,session_goal",
  },
  {
    name: "exercises_source_column",
    sql: `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'exercises'
        and column_name = 'source';
    `,
    expect: (rows) => rows.length === 1,
  },
  {
    name: "rls_enabled",
    sql: `
      select relname, relrowsecurity
      from pg_class
      where relnamespace = 'public'::regnamespace
        and relname in (
          'exercises',
          'training_plans',
          'training_sessions',
          'training_session_exercises'
        )
      order by relname;
    `,
    expect: (rows) => rows.length === 4 && rows.every((r) => r.relrowsecurity === true),
  },
  {
    name: "baseline_counts",
    sql: `
      select
        (select count(*) from public.exercises) as exercises,
        (select count(*) from public.training_plans) as training_plans,
        (select count(*) from public.training_sessions) as training_sessions,
        (select count(*) from public.training_session_exercises) as session_exercises;
    `,
    expect: (rows) => {
      const row = rows[0];
      return (
        Number(row.exercises) === 0 &&
        Number(row.training_plans) === 0 &&
        Number(row.training_sessions) === 0 &&
        Number(row.session_exercises) === 0
      );
    },
  },
  {
    name: "policy_count",
    sql: `
      select tablename, count(*)::int as policy_count
      from pg_policies
      where schemaname = 'public'
        and tablename in (
          'exercises',
          'training_plans',
          'training_sessions',
          'training_session_exercises'
        )
      group by tablename
      order by tablename;
    `,
    expect: (rows) => rows.length === 4 && rows.every((r) => Number(r.policy_count) >= 4),
  },
];

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    console.log("Applying migration 020_daily_training_foundation.sql ...");
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
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
