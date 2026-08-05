import { chromium, firefox, webkit, devices } from "playwright";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const pages = ["/", "/marketplace", "/stallions", "/breeders", "/login", "/sell"];

const DEV_ERROR_PATTERNS = [
  /webpack/i,
  /hmr/i,
  /hot-update/i,
  /Failed to fetch RSC payload/i,
  /ChunkLoadError/i,
  /Loading chunk/i,
  /Failed to load chunk/i,
  /NetworkError when attempting to fetch resource/i,
  /access control checks/i,
  /TypeError: Load failed/i,
  /CORS/i,
  /__nextjs/i,
  /react-server-dom-turbopack/i,
];

function isDevNoise(message) {
  return DEV_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function auditPage(browserName, page, path) {
  const errors = [];
  const warnings = [];

  page.on("pageerror", (err) => {
    if (!isDevNoise(err.message)) {
      errors.push(`pageerror: ${err.message}`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isDevNoise(msg.text())) {
      errors.push(`console: ${msg.text()}`);
    }
  });

  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(800);

    const audit = await page.evaluate(() => {
      const issues = [];
      const docEl = document.documentElement;
      const body = document.body;

      if (docEl.scrollWidth > docEl.clientWidth + 2) {
        issues.push(`horizontal-overflow:${docEl.scrollWidth - docEl.clientWidth}px`);
      }

      const fixedHeader = document.querySelector("header.glass-surface, header");
      if (fixedHeader) {
        const rect = fixedHeader.getBoundingClientRect();
        if (rect.top > 2) {
          issues.push(`fixed-header-offset:${Math.round(rect.top)}px`);
        }

        const style = getComputedStyle(document.body);
        const overflowX = style.overflowX;
        if (
          (overflowX === "hidden" || overflowX === "clip") &&
          rect.top < 0
        ) {
          issues.push("fixed-header-clipped-by-body-overflow");
        }
      }

      const glassHeader = document.querySelector("header.glass-surface");
      if (glassHeader) {
        const headerStyle = getComputedStyle(glassHeader);
        const hasSolidFallback =
          headerStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          headerStyle.backgroundColor !== "transparent";
        const supportsBackdrop =
          CSS.supports("backdrop-filter", "blur(1px)") ||
          CSS.supports("-webkit-backdrop-filter", "blur(1px)");

        if (!supportsBackdrop && !hasSolidFallback) {
          issues.push("glass-surface-missing-solid-fallback");
        }
      }

      return { issues, userAgent: navigator.userAgent };
    });

    warnings.push(...audit.issues);
  } catch (err) {
    errors.push(String(err?.message || err));
  }

  return {
    browser: browserName,
    path,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

async function runBrowser(name, launch) {
  const browser = await launch();
  const contextOptions =
    name === "firefox"
      ? { viewport: { width: 390, height: 844 }, locale: "en-US" }
      : { ...devices["iPhone 13"], locale: "en-US" };
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const results = [];

  for (const path of pages) {
    results.push(await auditPage(name, page, path));
  }

  await browser.close();
  return results;
}

const allResults = [
  ...(await runBrowser("chromium", () => chromium.launch({ headless: true }))),
  ...(await runBrowser("firefox", () => firefox.launch({ headless: true }))),
  ...(await runBrowser("webkit-safari", () => webkit.launch({ headless: true }))),
];

const failures = allResults.filter((r) => !r.ok || r.warnings.length > 0);
console.log(
  JSON.stringify(
    {
      total: allResults.length,
      failures: failures.length,
      results: allResults,
    },
    null,
    2
  )
);
