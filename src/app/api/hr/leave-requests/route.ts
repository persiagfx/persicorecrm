import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const isAdmin = payload.role === "admin" || payload.role === "hr";

    const tenantUserFilter = isAdmin && payload.tenantId ? { user: { tenantId: payload.tenantId } } : {};
    const requests = await prisma.leaveRequest.findMany({
      where: {
        ...(isAdmin ? tenantUserFilter : { userId: payload.userId }),
        ...(status ? { status } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(requests);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.startDate || !body.endDate) return badRequest("تاریخ شروع و پایان الزامی است");

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    const request = await prisma.leaveRequest.create({
      data: {
        userId: payload.userId,
        type: body.type ?? "annual",
        startDate: start,
        endDate: end,
        days,
        reason: body.reason ?? null,
        status: "pending",
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return created(request);
  } catch (e) { return serverError(e); }
}
