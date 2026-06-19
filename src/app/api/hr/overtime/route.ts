import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const month = searchParams.get("month");

    const startDate = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = month
      ? new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(userId ? { userId } : {}),
        checkIn: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { checkIn: "asc" },
    });

    const userIds = [...new Set(attendance.map(a => a.userId))];
    const shiftAssignments = await prisma.shiftAssignment.findMany({
      where: {
        userId: { in: userIds },
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
      include: { shift: true },
    });

    const shiftByUser: Record<string, typeof shiftAssignments[0]> = {};
    for (const sa of shiftAssignments) shiftByUser[sa.userId] = sa;

    const byUser: Record<string, {
      userId: string; name: string; avatar: string | null;
      overtimeMinutes: number; lateMinutes: number; earlyLeaveMinutes: number; presentDays: number;
    }> = {};

    for (const record of attendance) {
      const uid = record.userId;
      if (!byUser[uid]) {
        byUser[uid] = {
          userId: uid,
          name: record.user.name,
          avatar: record.user.avatar,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          presentDays: 0,
        };
      }
      byUser[uid].presentDays++;

      const sa = shiftByUser[uid];
      if (!sa || !record.checkIn) continue;
      const shift = sa.shift;

      const checkInTime = record.checkIn;
      const [shiftStartH, shiftStartM] = shift.startTime.split(":").map(Number);
      const shiftStart = new Date(checkInTime);
      shiftStart.setHours(shiftStartH, shiftStartM, 0, 0);

      const lateMs = checkInTime.getTime() - shiftStart.getTime();
      if (lateMs > 5 * 60 * 1000) byUser[uid].lateMinutes += Math.round(lateMs / 60000);

      if (record.checkOut) {
        const checkOutTime = record.checkOut;
        const [shiftEndH, shiftEndM] = shift.endTime.split(":").map(Number);
        const shiftEnd = new Date(checkInTime);
        shiftEnd.setHours(shiftEndH, shiftEndM, 0, 0);

        const overtimeMs = checkOutTime.getTime() - shiftEnd.getTime();
        if (overtimeMs > 15 * 60 * 1000) byUser[uid].overtimeMinutes += Math.round(overtimeMs / 60000);

        const earlyLeaveMs = shiftEnd.getTime() - checkOutTime.getTime();
        if (earlyLeaveMs > 5 * 60 * 1000) byUser[uid].earlyLeaveMinutes += Math.round(earlyLeaveMs / 60000);
      }
    }

    return ok(Object.values(byUser));
  } catch (e) { return serverError(e); }
}
