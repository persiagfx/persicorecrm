import { NextRequest } from "next/server";
import { verifyToken, unauthorized, ok, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      req.cookies.get("admin_token")?.value ??
      null;

    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.userId !== "superadmin") return unauthorized();

    return ok({ id: "superadmin", phone: payload.phone, role: "admin", name: "Super Admin" });
  } catch (e) {
    return serverError(e);
  }
}
