import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!payload.tenantId) return ok(null);

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      include: {
        _count: { select: { users: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!tenant) return notFound("workspace");

    const clientCount = await prisma.client.count({ where: { tenantId: payload.tenantId } });

    return ok({ ...tenant, clientCount });
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!payload.tenantId) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند تنظیمات workspace را تغییر دهد" }, { status: 403 });

    const body = await req.json();
    const updated = await prisma.tenant.update({
      where: { id: payload.tenantId },
      data: {
        name: body.name ?? undefined,
        industry: body.industry ?? undefined,
        phone: body.phone ?? undefined,
        address: body.address ?? undefined,
        logoUrl: body.logoUrl ?? undefined,
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
