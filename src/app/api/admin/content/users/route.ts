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
    const search = url.searchParams.get("search") ?? "";
    const plan = url.searchParams.get("plan");
    const limit = 20;

    const where = {
      ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] } : {}),
      ...(plan ? { plan: plan as "FREE" | "PRO" | "PLUS" } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.contentUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { subscription: true, _count: { select: { generations: true } } },
      }),
      prisma.contentUser.count({ where }),
    ]);

    return ok({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return serverError(e);
  }
}
