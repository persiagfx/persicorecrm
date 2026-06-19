import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const platform = url.searchParams.get("platform");
    const limit = 12;

    const where = payload.isContentUser
      ? { contentUserId: payload.userId, ...(platform ? { platform } : {}) }
      : { crmUserId: payload.userId, ...(platform ? { platform } : {}) };

    const [items, total] = await Promise.all([
      prisma.contentGeneration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          platform: true,
          language: true,
          topic: true,
          tone: true,
          contentType: true,
          keyword: true,
          textOutput: true,
          editedText: true,
          imageUrl: true,
          seoScore: true,
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
