type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Simple in-memory sliding-window rate limiter for server actions. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(existing.resetAt - now, 0) };
  }

  existing.count += 1;
  return { allowed: true };
}

export function rateLimitError(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
