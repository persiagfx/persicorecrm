import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ─── Redis client (Edge-compatible via @upstash/redis) ───────────────────────
// Initialized lazily so missing env vars don't crash unrelated routes.
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Atomic Lua: INCR + PEXPIRE on first hit → returns [count, pttl_ms]
const RL_SCRIPT = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1])) end
return {c, redis.call('PTTL', KEYS[1])}
`;

async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedis();

  // Fail-open: if Redis is not configured or unavailable, allow the request
  if (!redis) {
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }

  try {
    const result = (await redis.eval(
      RL_SCRIPT,
      [`mw:rl:${key}`],
      [windowMs]
    )) as [number, number];
    const count = result[0];
    const pttl = Math.max(result[1] ?? 0, 0);
    const resetAt = Date.now() + pttl;

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: Math.max(0, maxRequests - count), resetAt };
  } catch {
    // Fail-open: Redis error → allow the request rather than block all traffic
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

// Paths exempt from rate limiting
const RATE_LIMIT_SKIP = [
  "/api/auth/",
  "/api/portal/auth/",
  "/api/agent/",
  "/api/stream",
  "/api/files",
];

function shouldSkipRateLimit(pathname: string): boolean {
  return RATE_LIMIT_SKIP.some((prefix) => pathname.startsWith(prefix));
}

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Subdomains with their own auth — exempt from main-app CSRF check
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/",
  "/api/agent/",
  "/api/content/",
  "/api/portal/",
  "/api/resume/",
  "/api/proposal/",
  "/api/blog/",
];

function checkCsrf(request: NextRequest): NextResponse | null {
  if (CSRF_SAFE_METHODS.has(request.method)) return null;
  if (!request.nextUrl.pathname.startsWith("/api/")) return null;
  if (CSRF_EXEMPT_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${host}`;

  if (!origin) return null;

  try {
    const originHost = new URL(origin).host;
    if (originHost === host) return null;
    const allowedHost = new URL(appUrl).host;
    if (
      originHost !== allowedHost &&
      !originHost.endsWith(`.${allowedHost.split(".").slice(-2).join(".")}`)
    ) {
      return NextResponse.json({ error: "درخواست نامعتبر (CSRF)" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر (CSRF)" }, { status: 403 });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // ─── CSRF protection ──────────────────────────────────────────────────────
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  // ─── Rate limiting for /api routes ────────────────────────────────────────
  if (url.pathname.startsWith("/api/") && !shouldSkipRateLimit(url.pathname)) {
    const authCookie = request.cookies.get("auth_token")?.value;
    let rateLimitKey: string;
    let limit: number;

    if (authCookie) {
      // Decode JWT payload without verification — only for bucketing, not security
      try {
        const payloadB64 = authCookie.split(".")[1];
        const payload = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString("utf-8")
        );
        const tenantId: string = payload.tenantId ?? payload.userId ?? "unknown";
        rateLimitKey = `api:${tenantId}:${url.pathname}`;
      } catch {
        rateLimitKey = `api:unknown:${url.pathname}`;
      }
      limit = 100; // 100 req/min per tenant
    } else {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      rateLimitKey = `ip:${ip}:${url.pathname}`;
      limit = 30; // 30 req/min per IP
    }

    const result = await checkRateLimit(rateLimitKey, limit, 60 * 1000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "نرخ درخواست بیش از حد مجاز" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // ─── agent.persicore.ir → /agent/... ──────────────────────────────
  if (hostname.startsWith("agent.")) {
    if (!url.pathname.startsWith("/agent") && !url.pathname.startsWith("/api/agent")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/agent" + url.pathname.slice(4);
      } else {
        url.pathname = "/agent" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── portal.persicore.ir → /portal/... ─────────────────────────────
  if (hostname.startsWith("portal.")) {
    const PORTAL_PUBLIC_API = ["/api/invoices/sign/", "/api/contracts/sign/"];
    if (
      !url.pathname.startsWith("/portal") &&
      !url.pathname.startsWith("/api/portal") &&
      !PORTAL_PUBLIC_API.some((p) => url.pathname.startsWith(p))
    ) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/portal" + url.pathname.slice(4);
      } else {
        url.pathname = "/portal" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── admin.persicore.ir → /admin/... ───────────────────────────────
  if (hostname.startsWith("admin.")) {
    if (!url.pathname.startsWith("/admin") && !url.pathname.startsWith("/api/admin")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/admin" + url.pathname.slice(4);
      } else {
        url.pathname = "/admin" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── resume.persicore.ir → /resume/... ────────────────────────────
  if (hostname.startsWith("resume.")) {
    if (!url.pathname.startsWith("/resume") && !url.pathname.startsWith("/api/resume")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/resume" + url.pathname.slice(4);
      } else {
        url.pathname = "/resume" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── proposal.persicore.ir → /proposal/... ────────────────────────
  if (hostname.startsWith("proposal.")) {
    if (!url.pathname.startsWith("/proposal") && !url.pathname.startsWith("/api/proposal")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/proposal" + url.pathname.slice(4);
      } else {
        url.pathname = "/proposal" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── blog.persicore.ir → /blog/... ─────────────────────────────────
  if (hostname.startsWith("blog.")) {
    if (!url.pathname.startsWith("/blog") && !url.pathname.startsWith("/api/blog")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/blog" + url.pathname.slice(4);
      } else {
        url.pathname = "/blog" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── content.persicore.ir → /content/... ──────────────────────────
  if (hostname.startsWith("content.")) {
    if (!url.pathname.startsWith("/content") && !url.pathname.startsWith("/api/content")) {
      if (url.pathname.startsWith("/api/")) {
        url.pathname = "/api/content" + url.pathname.slice(4);
      } else {
        url.pathname = "/content" + url.pathname;
      }
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
