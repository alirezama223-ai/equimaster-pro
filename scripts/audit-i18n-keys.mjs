import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const locales = ["en", "de", "fr", "nl", "es"];
const appDir = path.join(root, "app");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function flattenMessages(obj, prefix = "") {
  const keys = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const child of flattenMessages(value, next)) {
        keys.add(child);
      }
    } else {
      keys.add(next);
    }
  }
  return keys;
}

function loadMessagesByLocale() {
  const enDir = path.join(root, "messages", "en");
  const namespaces = fs
    .readdirSync(enDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""));

  const byLocale = {};
  for (const locale of locales) {
    byLocale[locale] = {};
    for (const namespace of namespaces) {
      const filePath = path.join(root, "messages", locale, `${namespace}.json`);
      if (!fs.existsSync(filePath)) {
        byLocale[locale][namespace] = new Set();
        continue;
      }
      byLocale[locale][namespace] = flattenMessages(readJson(filePath));
    }
  }
  return { namespaces, byLocale };
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function resolveNamespace(baseNamespace, key) {
  // useTranslations("home.featured") + t("title") => home.featured.title
  const parts = baseNamespace.split(".");
  if (parts.length > 1) {
    const rootNs = parts[0];
    const subPrefix = parts.slice(1).join(".");
    return {
      namespace: rootNs,
      key: subPrefix ? `${subPrefix}.${key}` : key,
    };
  }
  return { namespace: baseNamespace, key };
}

function extractTranslatorBindings(source) {
  const bindings = new Map();

  const patterns = [
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      bindings.set(match[1], match[2]);
    }
  }

  return bindings;
}

function extractStaticKeys(source, varName) {
  const keys = [];
  // Require `t(` not to be part of another identifier (e.g. get("error")).
  const staticPattern = new RegExp(
    String.raw`(?<![A-Za-z0-9_$])${varName}\(\s*["']([^"']+)["']`,
    "g"
  );
  const templatePattern = new RegExp(
    String.raw`(?<![A-Za-z0-9_$])${varName}\(\s*\`([^\`$]+)\``,
    "g"
  );

  for (const match of source.matchAll(staticPattern)) {
    keys.push({ key: match[1], dynamic: false });
  }
  for (const match of source.matchAll(templatePattern)) {
    keys.push({ key: match[1], dynamic: false });
  }

  const dynamicPattern = new RegExp(
    String.raw`(?<![A-Za-z0-9_$])${varName}\(\s*\`[^\`]*\$\{[^\}]+\}[^\`]*\``,
    "g"
  );
  for (const match of source.matchAll(dynamicPattern)) {
    keys.push({ key: match[0], dynamic: true });
  }

  const dynamicStringPattern = new RegExp(
    String.raw`(?<![A-Za-z0-9_$])${varName}\(\s*["'][^"']*\$\{[^\}]+\}[^"']*["']`,
    "g"
  );
  for (const match of source.matchAll(dynamicStringPattern)) {
    keys.push({ key: match[0], dynamic: true });
  }

  return keys;
}

function hasKey(messagesByLocale, locale, namespace, key) {
  return messagesByLocale[locale][namespace]?.has(key) ?? false;
}

const { byLocale: messagesByLocale } = loadMessagesByLocale();
const files = walk(appDir);

const missing = [];
const dynamicUsages = [];
const checked = new Set();

for (const filePath of files) {
  const source = fs.readFileSync(filePath, "utf8");
  const relFile = path.relative(root, filePath);
  const bindings = extractTranslatorBindings(source);

  if (bindings.size === 0) continue;

  for (const [varName, baseNamespace] of bindings) {
    const keys = extractStaticKeys(source, varName);
    for (const { key, dynamic } of keys) {
      if (dynamic) {
        dynamicUsages.push({ file: relFile, varName, baseNamespace, expression: key });
        continue;
      }

      const { namespace, key: resolvedKey } = resolveNamespace(baseNamespace, key);
      const id = `${namespace}::${resolvedKey}`;
      if (checked.has(`${relFile}::${id}`)) continue;
      checked.add(`${relFile}::${id}`);

      for (const locale of locales) {
        if (!hasKey(messagesByLocale, locale, namespace, resolvedKey)) {
          missing.push({
            locale,
            namespace,
            key: resolvedKey,
            fullKey: `${namespace}.${resolvedKey}`,
            file: relFile,
            via: `${varName}("${key}")`,
            baseNamespace,
          });
        }
      }
    }
  }
}

missing.sort((a, b) =>
  a.locale.localeCompare(b.locale) ||
  a.fullKey.localeCompare(b.fullKey) ||
  a.file.localeCompare(b.file)
);

const grouped = new Map();
for (const item of missing) {
  const groupKey = `${item.fullKey}`;
  if (!grouped.has(groupKey)) {
    grouped.set(groupKey, {
      fullKey: item.fullKey,
      namespace: item.namespace,
      key: item.key,
      files: new Set(),
      missingLocales: new Set(),
    });
  }
  const group = grouped.get(groupKey);
  group.files.add(item.file);
  group.missingLocales.add(item.locale);
}

const report = {
  scannedFiles: files.length,
  translatorFiles: files.filter((f) => extractTranslatorBindings(fs.readFileSync(f, "utf8")).size > 0).length,
  locales,
  missingKeyCount: grouped.size,
  missingOccurrenceCount: missing.length,
  dynamicUsageCount: dynamicUsages.length,
  missing: [...grouped.values()]
    .map((g) => ({
      fullKey: g.fullKey,
      missingInLocales: [...g.missingLocales].sort(),
      files: [...g.files].sort(),
    }))
    .sort((a, b) => a.fullKey.localeCompare(b.fullKey)),
  dynamicUsages: dynamicUsages
    .map((d) => ({
      file: d.file,
      baseNamespace: d.baseNamespace,
      varName: d.varName,
      expression: d.expression.slice(0, 120),
    }))
    .sort((a, b) => a.file.localeCompare(b.file) || a.baseNamespace.localeCompare(b.baseNamespace)),
};

const outJson = path.join(root, "docs", "i18n-missing-keys-report.json");
const outMd = path.join(root, "docs", "i18n-missing-keys-report.md");
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

const mdLines = [
  "# i18n Missing Keys Report",
  "",
  `Generated by \`scripts/audit-i18n-keys.mjs\``,
  "",
  "## Summary",
  "",
  `- Scanned **${report.scannedFiles}** TypeScript files (${report.translatorFiles} use translators)`,
  `- Locales checked: **${report.locales.join(", ")}**`,
  `- Missing unique static keys: **${report.missingKeyCount}**`,
  `- Missing locale entries (key × locale): **${report.missingOccurrenceCount}**`,
  `- Dynamic usages (not statically verifiable): **${report.dynamicUsageCount}**`,
  "",
];

if (report.missing.length === 0) {
  mdLines.push("No missing static translation keys found.", "");
} else {
  mdLines.push("## Missing static keys", "");
  for (const item of report.missing) {
    mdLines.push(`### \`${item.fullKey}\``);
    mdLines.push("");
    mdLines.push(`- **Missing in:** ${item.missingInLocales.join(", ")}`);
    mdLines.push(`- **Used in:** ${item.files.map((f) => `\`${f}\``).join(", ")}`);
    mdLines.push("");
  }
}

if (report.dynamicUsages.length > 0) {
  mdLines.push("## Dynamic key usages (manual review required)", "");
  mdLines.push(
    "These template literals build keys at runtime. Ensure every possible value exists in all locale files.",
    ""
  );
  for (const item of report.dynamicUsages) {
    mdLines.push(
      `- \`${item.baseNamespace}\` via \`${item.varName}(…)\` in \`${item.file}\`: \`${item.expression}\``
    );
  }
  mdLines.push("");
}

fs.writeFileSync(outMd, mdLines.join("\n"));

console.log(`Scanned ${report.scannedFiles} files (${report.translatorFiles} with translators)`);
console.log(`Missing unique keys: ${report.missingKeyCount}`);
console.log(`Missing locale entries: ${report.missingOccurrenceCount}`);
console.log(`Dynamic key usages (not statically verifiable): ${report.dynamicUsageCount}`);
console.log(`Report written to ${path.relative(root, outJson)}`);
console.log(`Report written to ${path.relative(root, outMd)}`);
console.log("---");

for (const item of report.missing) {
  console.log(`${item.fullKey}`);
  console.log(`  missing: ${item.missingInLocales.join(", ")}`);
  console.log(`  files: ${item.files.join(", ")}`);
}
