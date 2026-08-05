import { chromium } from "playwright";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const ROUTES = ["/", "/marketplace", "/stallions", "/breeders"];

function collectJsBytes(rootDir) {
  let total = 0;
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".js")) continue;
      const size = statSync(fullPath).size;
      total += size;
      files.push({ path: fullPath, size });
    }
  }

  walk(rootDir);
  files.sort((a, b) => b.size - a.size);
  return { total, files };
}

async function measureRoute(page, path) {
  const requests = [];
  page.on("response", (response) => {
    const url = response.url();
    if (response.request().resourceType() === "script") {
      requests.push({ url, size: Number(response.headers()["content-length"] ?? 0) });
    }
  });

  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 90000 });

  const vitals = await page.evaluate(async () => {
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
    const navEntry = performance.getEntriesByType("navigation")[0];

    let lcp = null;
    let cls = 0;

    await new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        resolve(null);
      };

      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            lcp = last.startTime;
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });

        setTimeout(finish, 2500);
      } catch {
        finish();
      }
    });

    return {
      fcp: fcpEntry?.startTime ?? null,
      lcp,
      cls: Number(cls.toFixed(4)),
      domContentLoaded: navEntry?.domContentLoadedEventEnd ?? null,
      loadEvent: navEntry?.loadEventEnd ?? null,
    };
  });

  const scriptTransfer = requests.reduce((sum, item) => sum + item.size, 0);

  return {
    path,
    vitals,
    scriptRequests: requests.length,
    scriptTransferBytes: scriptTransfer,
  };
}

function grade(metric, good, poor) {
  if (metric == null) return "n/a";
  if (metric <= good) return "good";
  if (metric <= poor) return "needs-improvement";
  return "poor";
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "en-US",
});
const page = await context.newPage();

const routeResults = [];
for (const path of ROUTES) {
  routeResults.push(await measureRoute(page, path));
}

await browser.close();

const staticDir = join(process.cwd(), ".next", "static");
let bundle = { total: 0, files: [] };
try {
  bundle = collectJsBytes(staticDir);
} catch {
  bundle = { total: 0, files: [] };
}

const summary = {
  baseUrl: BASE,
  measuredAt: new Date().toISOString(),
  routes: routeResults.map((result) => ({
    ...result,
    grades: {
      fcp: grade(result.vitals.fcp, 1800, 3000),
      lcp: grade(result.vitals.lcp, 2500, 4000),
      cls: grade(result.vitals.cls, 0.1, 0.25),
    },
  })),
  bundle: {
    staticJsTotalKB: Math.round(bundle.total / 1024),
    largestChunks: bundle.files.slice(0, 12).map((file) => ({
      name: file.path.split(".next\\static\\").pop() ?? file.path,
      kb: Math.round(file.size / 1024),
    })),
  },
};

console.log(JSON.stringify(summary, null, 2));
