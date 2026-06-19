import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tf = tenantFilter(payload);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalClients,
      activeProjects,
      overdueInvoices,
      paidThisMonth,
      paidLastMonth,
      newLeads,
      recentActivities,
      topClients,
      pendingTasks,
      runningTimer,
      upcomingReminders,
    ] = await Promise.all([
      prisma.client.count({ where: tf }),
      prisma.project.count({ where: { ...tf, status: { in: ["in_progress", "planning", "review"] } } }),
      prisma.invoice.count({ where: { ...tf, status: "overdue" } }),
      prisma.invoice.aggregate({
        where: { ...tf, status: "paid", paidAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { ...tf, status: "paid", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      prisma.lead.count({ where: { ...tf, createdAt: { gte: startOfMonth } } }),
      prisma.activityLog.findMany({
        where: tf,
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { actor: { select: { id: true, name: true, avatar: true, color: true } } },
      }),
      prisma.client.findMany({
        where: tf,
        orderBy: { totalRevenue: "desc" },
        take: 5,
        select: { id: true, companyName: true, totalRevenue: true, status: true, avatar: true },
      }),
      prisma.task.findMany({
        where: {
          ...(payload.tenantId ? { project: { tenantId: payload.tenantId } } : {}),
          status: { not: "done" },
          dueDate: { lte: new Date(Date.now() + 7 * 86400000) },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.timeEntry.findFirst({
        where: { userId: payload.userId, isRunning: true },
        include: { task: true, project: { select: { id: true, name: true } } },
      }),
      prisma.reminder.findMany({
        where: { userId: payload.userId, isCompleted: false, dueDate: { gte: now } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    // Revenue by month (last 6 months)
    const revenueByMonth = payload.tenantId
      ? await prisma.$queryRaw<{ month: string; revenue: number }[]>`
          SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(total) as revenue
          FROM Invoice
          WHERE status = 'paid' AND tenantId = ${payload.tenantId}
            AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month ASC`
      : await prisma.$queryRaw<{ month: string; revenue: number }[]>`
          SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(total) as revenue
          FROM Invoice
          WHERE status = 'paid' AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY month ORDER BY month ASC`;

    // Lead pipeline stats
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: tf,
      _count: { id: true },
      _sum: { estimatedValue: true },
    });

    const revenue = paidThisMonth._sum.total ?? 0;
    const lastRevenue = paidLastMonth._sum.total ?? 0;
    const revenueGrowth = lastRevenue > 0 ? Math.round(((revenue - lastRevenue) / lastRevenue) * 100) : 0;

    return ok({
      stats: { totalClients, activeProjects, overdueInvoices, revenue, revenueGrowth, newLeads },
      revenueByMonth,
      leadsByStatus,
      recentActivities,
      topClients,
      pendingTasks,
      runningTimer,
      upcomingReminders,
    });
  } catch (e) {
    return serverError(e);
  }
}
