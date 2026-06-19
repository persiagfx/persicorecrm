import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET;
if (!PORTAL_JWT_SECRET) throw new Error("PORTAL_JWT_SECRET environment variable is required");
const SECRET: string = PORTAL_JWT_SECRET;

export interface PortalJwtPayload {
  portalUserId: string;
  clientId: string;
  role: string;
}

export function signPortalToken(payload: PortalJwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyPortalToken(token: string): PortalJwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as PortalJwtPayload;
  } catch {
    return null;
  }
}

export function requirePortalAuth(req: NextRequest): PortalJwtPayload | null {
  const auth = req.headers.get("authorization");
  let token: string | null = null;
  if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  if (!token) token = req.cookies.get("portal_token")?.value ?? null;
  if (!token) return null;
  return verifyPortalToken(token);
}
