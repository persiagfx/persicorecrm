import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";
import { logActivitySilent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = 30;

    const where = {
      ...tenantFilter(payload),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { calledAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(logs, { total, page, perPage });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.entityType || !body.entityId) return badRequest("نوع و شناسه موجودیت الزامی است");

    const log = await prisma.callLog.create({
      data: {
        tenantId: payload.tenantId ?? null,
        entityType: body.entityType,
        entityId: body.entityId,
        direction: body.direction ?? "outbound",
        outcome: body.outcome ?? "no_answer",
        duration: body.duration ?? null,
        notes: body.notes ?? null,
        userId: payload.userId,
        calledAt: body.calledAt ? new Date(body.calledAt) : new Date(),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    logActivitySilent({
      actorId: payload.userId,
      action: "call_logged",
      entityType: body.entityType,
      entityId: body.entityId,
      entityName: body.entityName ?? body.entityId,
      description: `تماس ${body.direction === "inbound" ? "دریافتی" : "خروجی"} ثبت شد — نتیجه: ${body.outcome}`,
      req,
    });

    return created(log);
  } catch (e) { return serverError(e); }
}
