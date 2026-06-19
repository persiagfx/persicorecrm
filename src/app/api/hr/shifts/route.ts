import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const shifts = await prisma.workShift.findMany({
      where: tenantFilter(payload),
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: "asc" },
    });
    return ok(shifts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name?.trim() || !body.startTime || !body.endTime) return badRequest("نام، ساعت شروع و پایان الزامی است");
    const shift = await prisma.workShift.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name.trim(),
        startTime: body.startTime,
        endTime: body.endTime,
        breakMins: body.breakMins ?? 60,
        workDays: body.workDays ?? [1, 2, 3, 4, 5],
        color: body.color ?? "#6366f1",
        isActive: body.isActive ?? true,
      },
    });
    return created(shift);
  } catch (e) { return serverError(e); }
}
