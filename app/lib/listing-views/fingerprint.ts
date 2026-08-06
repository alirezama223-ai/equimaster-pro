import { createHash } from "crypto";

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip.trim()).digest("hex");
}

export function normalizeUserAgent(userAgent: string | null): string {
  return (userAgent ?? "unknown").trim().slice(0, 512) || "unknown";
}
