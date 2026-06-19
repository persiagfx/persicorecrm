import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const userId = payload.userId;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [user, latestPayroll, leaveStats, attendanceStats, currentShift, pendingOnboarding] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true },
      }),
      prisma.payrollRecord.findFirst({
        where: { userId, tenantId: payload.tenantId ?? null },
        orderBy: { period: "desc" },
      }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where: { userId, startDate: { gte: new Date(now.getFullYear(), 0, 1) } },
        _count: true,
      }),
      prisma.attendance.aggregate({
        where: { userId, checkIn: { gte: monthStart, lte: monthEnd } },
        _count: { id: true },
      }),
      prisma.shiftAssignment.findFirst({
        where: {
          userId,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        include: { shift: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.employeeOnboarding.findFirst({
        where: { userId, status: { not: "completed" } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const leaveMap: Record<string, number> = {};
    for (const g of leaveStats) leaveMap[g.status] = g._count;

    const orgNode = await prisma.orgNode.findUnique({
      where: { userId },
      select: { position: true, department: true },
    });

    return ok({
      user: user ? { ...user, department: orgNode?.department ?? null, position: orgNode?.position ?? null } : null,
      payroll: latestPayroll,
      leaves: { approved: leaveMap["approved"] ?? 0, pending: leaveMap["pending"] ?? 0, total: Object.values(leaveMap).reduce((a, b) => a + b, 0) },
      attendance: { presentDays: attendanceStats._count.id },
      shift: currentShift?.shift ?? null,
      onboarding: pendingOnboarding,
    });
  } catch (e) { return serverError(e); }
}
