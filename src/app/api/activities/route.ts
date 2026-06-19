import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const actorId = searchParams.get("actorId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = 30;

    const isAdmin = payload.role === "admin";

    const where = {
      ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorId ? { actorId } : {}),
      ...(action ? { action: { contains: action } } : {}),
      ...(!isAdmin ? { actorId: payload.userId } : {}),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
        },
      } : {}),
    };

    const [total, activities] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, avatar: true, color: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    // Extract ip and userAgent from metadata for convenience
    const enriched = activities.map((a) => {
      const meta = a.metadata as Record<string, unknown> | null;
      return {
        ...a,
        ip: (meta?.ip as string | undefined) ?? null,
        userAgent: (meta?.userAgent as string | undefined) ?? null,
        before: (meta?.before as Record<string, unknown> | undefined) ?? null,
        after: (meta?.after as Record<string, unknown> | undefined) ?? null,
      };
    });

    return ok(enriched, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}
