import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (token) {
    try {
      const tokenHash = createHash("sha256").update(token).digest("hex").slice(0, 96);
      await prisma.userSession.deleteMany({ where: { tokenHash } });
    } catch {
      // UserSession table may not exist yet — continue
    }
  }

  const res = Response.json({ data: { message: "خروج موفق" } });
  res.headers.set("Set-Cookie", "auth_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
  return res;
}
