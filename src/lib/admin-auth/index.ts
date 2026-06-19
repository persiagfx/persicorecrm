import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export function verifyAdminToken(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.cookies.get("admin_token")?.value ??
    null;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.userId !== "superadmin") return null;

  return payload;
}
