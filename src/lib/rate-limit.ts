import { getRedis, RATE_LIMIT_SCRIPT } from "@/lib/redis";

/**
 * Redis-backed rate limiter for API route handlers (Node.js runtime).
 * Middleware uses the same @upstash/redis in middleware.ts (Edge runtime).
 *
 * Uses an atomic Lua script: INCR + PEXPIRE on first hit — no race conditions.
 * Redis TTL manages expiry automatically; no manual pruning needed.
 *
 * Key formats (callers define these):
 *   "crm-login:{ip}"
 *   "otp-send-ip:{ip}"
 *   "agent-otp-phone:{phone}"
 *   etc.
 *
 * @returns { allowed, remaining, resetAt }
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const redis = getRedis();
  const rKey = `rl:${key}`;

  const result = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    [rKey],
    [windowMs]
  )) as [number, number];

  const count = result[0];
  const pttl = Math.max(result[1] ?? 0, 0);
  const resetAt = new Date(Date.now() + pttl);

  if (count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count),
    resetAt,
  };
}

/**
 * Extract client IP from a NextRequest (or any object with headers).
 */
export function getClientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * No-op: Redis manages TTL automatically.
 * Kept for API compatibility — safe to call, returns 0.
 */
export async function pruneRateLimitEntries(): Promise<number> {
  return 0;
}
