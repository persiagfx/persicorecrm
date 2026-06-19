import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const platform = url.searchParams.get("platform");
    const limit = 20;

    const where = platform ? { platform } : {};

    const [items, total] = await Promise.all([
      prisma.contentGeneration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          platform: true,
          language: true,
          topic: true,
          tone: true,
          contentType: true,
          keyword: true,
          seoScore: true,
          contentUserId: true,
          crmUserId: true,
          createdAt: true,
        },
      }),
      prisma.contentGeneration.count({ where }),
    ]);

    return ok({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return serverError(e);
  }
}
