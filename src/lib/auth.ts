import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters long");
const SECRET: string = JWT_SECRET;
const JWT_EXPIRES = "7d";
export const BCRYPT_ROUNDS = 12;

export interface JwtPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  tenantId?: string;
  isSuperAdmin?: boolean;
  isContentUser?: boolean;
  plan?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: JWT_EXPIRES });
}

/** Returns a Prisma `where` fragment for tenant isolation. */
export function tenantFilter(payload: JwtPayload): { tenantId: string } | Record<string, never> {
  return payload.tenantId ? { tenantId: payload.tenantId } : {};
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.cookies.get("auth_token");
  return cookie?.value ?? null;
}

export function requireAuth(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(payload: JwtPayload, ...roles: string[]): Response | null {
  return roles.includes(payload.role) ? null : forbidden();
}

export function ok<T>(data: T, meta?: object) {
  return Response.json({ data, meta }, { status: 200 });
}

export function created<T>(data: T) {
  return Response.json({ data }, { status: 201 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: "احراز هویت الزامی است" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
}

export function notFound(entity = "رکورد") {
  return Response.json({ error: `${entity} یافت نشد` }, { status: 404 });
}

export function serverError(e: unknown) {
  logger.error("[API] Unhandled error:", e);
  return Response.json({ error: "خطای سرور" }, { status: 500 });
}

export function withHandler(
  handler: (req: NextRequest, ctx?: unknown) => Promise<Response>
): (req: NextRequest, ctx?: unknown) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      return serverError(e);
    }
  };
}
