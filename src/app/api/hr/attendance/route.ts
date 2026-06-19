import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const isAdmin = payload.role === "admin" || payload.role === "hr";
    const tenantUserFilter = isAdmin && payload.tenantId ? { user: { tenantId: payload.tenantId } } : {};
    const where = {
      ...(userId ? { userId } : isAdmin ? tenantUserFilter : { userId: payload.userId }),
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
        },
      } : {}),
    };

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: "desc" },
    });

    return ok(records);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    const isAdmin = payload.role === "admin" || payload.role === "hr";
    const targetUserId = (isAdmin && body.userId) ? body.userId : payload.userId;
    const date = new Date(body.date ?? new Date().toDateString());

    const parseTime = (timeStr: string, baseDate: Date) => {
      if (!timeStr) return null;
      if (timeStr.includes("T") || timeStr.includes("-")) return new Date(timeStr);
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: targetUserId, date } },
      create: {
        userId: targetUserId,
        date,
        checkIn: body.checkIn ? parseTime(body.checkIn, date) : null,
        checkOut: body.checkOut ? parseTime(body.checkOut, date) : null,
        status: body.status ?? "present",
        notes: body.notes ?? null,
      },
      update: {
        checkIn: body.checkIn ? parseTime(body.checkIn, date) : undefined,
        checkOut: body.checkOut ? parseTime(body.checkOut, date) : undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return created(record);
  } catch (e) { return serverError(e); }
}
