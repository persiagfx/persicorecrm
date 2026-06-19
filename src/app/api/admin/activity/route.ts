import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const entityType = searchParams.get("entityType") ?? "";
    const action = searchParams.get("action") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 30));
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { entityName: { contains: search } },
        { actor: { name: { contains: search } } },
        { actor: { email: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        include: {
          actor: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return ok(items, { total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (e) {
    return serverError(e);
  }
}
