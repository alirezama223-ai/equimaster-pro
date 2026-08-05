import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const pages = [
  "/",
  "/marketplace",
  "/horses",
  "/stallions",
  "/breeders",
  "/login",
  "/signup",
  "/sell",
  "/favorites",
  "/bloodlines",
  "/breeding-lab",
  "/training",
  "/account",
  "/admin",
  "/notifications",
];
const widths = [320, 375, 390, 414, 768];

function auditPage(page, width) {
  return page.evaluate((vw) => {
    const docSw = document.documentElement.scrollWidth;
    const offenders = [];

    document.querySelectorAll("*").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 4) return;

      const overflowsX =
        rect.right > vw + 2 &&
        style.position !== "fixed" &&
        style.position !== "sticky";

      if (overflowsX) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || "").slice(0, 100),
          w: Math.round(rect.width),
          right: Math.round(rect.right),
        });
      }

      if (
        (el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.tagName === "A") &&
        rect.width > 0 &&
        rect.height > 0 &&
        (rect.width < 40 || rect.height < 40) &&
        style.pointerEvents !== "none"
      ) {
        offenders.push({
          type: "small-target",
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || "").trim().slice(0, 40),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }

      if (
        el.childElementCount === 0 &&
        el.scrollWidth > el.clientWidth + 2 &&
        style.overflowX !== "auto" &&
        style.overflowX !== "scroll"
      ) {
        const text = (el.textContent || "").trim();
        if (text.length > 8) {
          offenders.push({
            type: "text-clip",
            tag: el.tagName.toLowerCase(),
            text: text.slice(0, 60),
            sw: el.scrollWidth,
            cw: el.clientWidth,
          });
        }
      }
    });

    const header = document.querySelector("header");
    let navbarIssue = null;
    if (header) {
      const hr = header.getBoundingClientRect();
      if (hr.width > vw + 2) {
        navbarIssue = { w: Math.round(hr.width), vw };
      }
    }

    return {
      overflow: docSw > vw + 1,
      scrollWidth: docSw,
      offenderCount: offenders.length,
      navbarIssue,
      top: offenders.slice(0, 6),
    };
  }, width);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const issues = [];

for (const width of widths) {
  for (const path of pages) {
    await page.setViewportSize({ width, height: 900 });
    try {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      if (!response || response.status() >= 400) {
        issues.push({ width, path, error: `HTTP ${response?.status() ?? "fail"}` });
        continue;
      }
      await page.waitForTimeout(500);
      const result = await auditPage(page, width);
      if (
        result.overflow ||
        result.navbarIssue ||
        result.offenderCount > 0
      ) {
        issues.push({ width, path, ...result });
      }
    } catch (err) {
      issues.push({ width, path, error: String(err.message || err) });
    }
  }
}

await browser.close();

console.log(JSON.stringify({ issueCount: issues.length, issues }, null, 2));
