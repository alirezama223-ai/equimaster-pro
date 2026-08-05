import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const SUPABASE_DIR = join(ROOT, "supabase", "migrations");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(fullPath, files);
    } else if (/\.(tsx?|sql|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function countPattern(files, pattern, label) {
  const hits = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const matches = content.match(pattern);
    if (matches?.length) {
      hits.push({
        file: relative(ROOT, file),
        count: matches.length,
      });
    }
  }
  return { label, hits, total: hits.reduce((sum, hit) => sum + hit.count, 0) };
}

function checkRequiredFiles() {
  const required = [
    "app/lib/supabase/proxy.ts",
    "app/lib/admin.ts",
    "app/lib/security/rate-limit.ts",
    "app/lib/security/path-validation.ts",
    "app/lib/feedback/validation.ts",
    "app/lib/listing-validation.ts",
    "app/auth/callback/route.ts",
    "supabase/migrations/037_view_count_rate_limit.sql",
  ];

  return required.map((path) => ({
    path,
    exists: statSync(join(ROOT, path), { throwIfNoEntry: false }) != null,
  }));
}

function countRlsMigrations() {
  const files = readdirSync(SUPABASE_DIR).filter((name) => name.endsWith(".sql"));
  let withRls = 0;
  let withPolicies = 0;

  for (const file of files) {
    const content = readFileSync(join(SUPABASE_DIR, file), "utf8");
    if (/enable row level security/i.test(content)) withRls += 1;
    if (/create policy/i.test(content)) withPolicies += 1;
  }

  return { migrationFiles: files.length, withRls, withPolicies };
}

function countServerActions(files) {
  let total = 0;
  let withAuthGuard = 0;

  for (const file of files) {
    if (!file.includes(`${join("app", "actions")}`)) continue;
    const content = readFileSync(file, "utf8");
    if (!content.includes('"use server"')) continue;
    total += 1;
    if (
      /getUser\(|requireAdmin\(|requireAuthenticatedUser\(/.test(content)
    ) {
      withAuthGuard += 1;
    }
  }

  return { total, withAuthGuard };
}

const files = walk(APP_DIR).concat(walk(SUPABASE_DIR));

const checks = {
  requiredFiles: checkRequiredFiles(),
  rls: countRlsMigrations(),
  serverActions: countServerActions(walk(join(APP_DIR, "actions"))),
  patterns: [
    countPattern(files, /dangerouslySetInnerHTML/g, "dangerouslySetInnerHTML"),
    countPattern(files, /eval\s*\(/g, "eval()"),
    countPattern(files, /innerHTML\s*=/g, "innerHTML assignment"),
    countPattern(
      files.filter((file) => !file.endsWith(".sql")),
      /\bpg\.|\bpostgres\b|sql\s*`/gi,
      "raw SQL in app code"
    ),
    countPattern(files, /validateFeedbackScreenshot/g, "feedback screenshot validation"),
    countPattern(files, /checkRateLimit/g, "rate limit usage"),
    countPattern(files, /sanitizeIlikePattern/g, "ILIKE sanitization"),
    countPattern(files, /isAcceptedImageType|validateListingVideoFile/g, "upload MIME validation"),
    countPattern(files, /requireAdmin\(/g, "requireAdmin guards"),
    countPattern(files, /enable row level security/gi, "RLS enable statements"),
    countPattern(files, /create policy/gi, "RLS policies"),
    countPattern(files, /allowed_mime_types/gi, "storage MIME allowlists"),
  ],
};

const missingRequired = checks.requiredFiles.filter((item) => !item.exists);
const warnings = [];

if (missingRequired.length > 0) {
  warnings.push(`Missing required security files: ${missingRequired.map((item) => item.path).join(", ")}`);
}

const xssHits = checks.patterns.find((item) => item.label === "dangerouslySetInnerHTML");
if (xssHits.total > 2) {
  warnings.push(`Unexpected dangerouslySetInnerHTML usage (${xssHits.total})`);
}

const rawSqlHits = checks.patterns.find((item) => item.label === "raw SQL in app code");
if (rawSqlHits.total > 0) {
  warnings.push(`Raw SQL references found in app code (${rawSqlHits.total})`);
}

const unguardedActions =
  checks.serverActions.total - checks.serverActions.withAuthGuard;
if (unguardedActions > 8) {
  warnings.push(
    `${unguardedActions} server action files may lack explicit auth guards (some are public by design)`
  );

}

console.log(
  JSON.stringify(
    {
      auditedAt: new Date().toISOString(),
      summary: {
        migrationFiles: checks.rls.migrationFiles,
        rlsMigrations: checks.rls.withRls,
        policyMigrations: checks.rls.withPolicies,
        serverActionFiles: checks.serverActions.total,
        serverActionsWithAuthPatterns: checks.serverActions.withAuthGuard,
        warnings: warnings.length,
        status: warnings.length === 0 ? "pass" : "pass-with-warnings",
      },
      warnings,
      checks,
    },
    null,
    2
  )
);
