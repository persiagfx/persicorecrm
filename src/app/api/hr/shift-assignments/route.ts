import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const shiftId = searchParams.get("shiftId") ?? undefined;

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        ...tenantFilter(payload),
        ...(userId ? { userId } : {}),
        ...(shiftId ? { shiftId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true, color: true } },
      },
      orderBy: { startDate: "desc" },
    });
    return ok(assignments);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.userId || !body.shiftId || !body.startDate) return badRequest("کارمند، شیفت و تاریخ شروع الزامی است");
    const assignment = await prisma.shiftAssignment.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: body.userId,
        shiftId: body.shiftId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes ?? null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true, color: true } },
      },
    });
    return created(assignment);
  } catch (e) { return serverError(e); }
}
