import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      activeUsers,
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      totalLeads,
      openLeads,
      totalInvoices,
      revenueAgg,
      pendingInvoiceAgg,
      totalContracts,
      signedContracts,
      totalExpenses,
      expenseAgg,
      totalTasks,
      openTasks,
      openTickets,
      totalTenants,
      activeTenants,
      recentActivity,
      usersByRole,
      monthlyRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count(),
      prisma.client.count({ where: { status: "active" } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: ["active", "in_progress"] } } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: { notIn: ["won", "lost"] } } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ where: { status: "paid" }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { status: { in: ["sent", "overdue"] } }, _sum: { total: true } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: "signed" } }),
      prisma.expense.count(),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: { notIn: ["done", "cancelled"] } } }),
      prisma.ticket.count({ where: { status: { notIn: ["resolved", "closed"] } } }),
      prisma.tenant.count().catch(() => 0),
      prisma.tenant.count({ where: { status: "active" } }).catch(() => 0),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { actor: { select: { id: true, name: true, avatar: true, role: true } } },
      }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.invoice.aggregate({
        where: { status: "paid", paidAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: "paid", paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { total: true },
      }),
    ]);

    const currentRevenue = Number(monthlyRevenue._sum.total ?? 0);
    const prevRevenue = Number(lastMonthRevenue._sum.total ?? 0);
    const revenueGrowth = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : 0;

    // Monthly revenue chart (last 6 months)
    const revenueChart = await prisma.$queryRaw<{ month: string; revenue: bigint }[]>`
      SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(total) as revenue
      FROM Invoice WHERE status = 'paid' AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `.catch(() => []);

    // New users per month (last 6 months)
    const userGrowth = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
      FROM User WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `.catch(() => []);

    // Recent new users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, isActive: true },
    });

    // Top clients by revenue
    const topClients = await prisma.client.findMany({
      orderBy: { totalRevenue: "desc" },
      take: 5,
      select: { id: true, companyName: true, totalRevenue: true, status: true, projectCount: true },
    });

    return ok({
      overview: {
        users: { total: totalUsers, active: activeUsers },
        clients: { total: totalClients, active: activeClients },
        projects: { total: totalProjects, active: activeProjects },
        leads: { total: totalLeads, open: openLeads },
        revenue: {
          total: Number(revenueAgg._sum.total ?? 0),
          pending: Number(pendingInvoiceAgg._sum.total ?? 0),
          thisMonth: currentRevenue,
          growth: revenueGrowth,
        },
        contracts: { total: totalContracts, signed: signedContracts },
        expenses: { total: totalExpenses, amount: Number(expenseAgg._sum.amount ?? 0) },
        tasks: { total: totalTasks, open: openTasks },
        tickets: { open: openTickets },
        tenants: { total: Number(totalTenants), active: Number(activeTenants) },
      },
      usersByRole: usersByRole.map((r: { role: string; _count: { _all: number } }) => ({ role: r.role, count: r._count._all })),
      revenueChart: revenueChart.map(r => ({
        month: r.month,
        revenue: Math.round(Number(r.revenue) / 1_000_000),
      })),
      userGrowth: userGrowth.map(r => ({
        month: r.month,
        count: Number(r.count),
      })),
      recentActivity,
      recentUsers,
      topClients,
    });
  } catch (e) {
    return serverError(e);
  }
}
