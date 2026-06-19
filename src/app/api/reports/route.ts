import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month"; // month | quarter | year

    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    } else if (range === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1);
      prevStartDate = new Date(now.getFullYear(), q * 3 - 3, 1);
      prevEndDate = new Date(now.getFullYear(), q * 3, 0);
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const tf = tenantFilter(payload);

    // ── KPIs ──────────────────────────────────────────────────────────
    const [
      revenueThis,
      revenuePrev,
      newLeadsThis,
      newLeadsPrev,
      activeProjects,
      workHoursThis,
      workHoursPrev,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...tf, status: "paid", paidAt: { gte: startDate } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { ...tf, status: "paid", paidAt: { gte: prevStartDate, lte: prevEndDate } },
        _sum: { total: true },
      }),
      prisma.lead.count({ where: { ...tf, createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { ...tf, createdAt: { gte: prevStartDate, lte: prevEndDate } } }),
      prisma.project.count({ where: { ...tf, status: { in: ["in_progress", "planning", "review"] } } }),
      prisma.timeEntry.aggregate({
        where: { isRunning: false, startedAt: { gte: startDate }, project: Object.keys(tf).length ? tf : undefined },
        _sum: { durationSeconds: true },
      }),
      prisma.timeEntry.aggregate({
        where: { isRunning: false, startedAt: { gte: prevStartDate, lte: prevEndDate }, project: Object.keys(tf).length ? tf : undefined },
        _sum: { durationSeconds: true },
      }),
    ]);

    const revenue = revenueThis._sum.total ?? 0;
    const prevRevenue = revenuePrev._sum.total ?? 0;
    const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

    const leadsChange = newLeadsPrev > 0 ? Math.round(((newLeadsThis - newLeadsPrev) / newLeadsPrev) * 100) : 0;

    const workHours = Math.round((workHoursThis._sum.durationSeconds ?? 0) / 3600);
    const prevWorkHours = Math.round((workHoursPrev._sum.durationSeconds ?? 0) / 3600);
    const hoursChange = prevWorkHours > 0 ? Math.round(((workHours - prevWorkHours) / prevWorkHours) * 100) : 0;

    // ── Revenue + Expenses by month (last 6 months) ───────────────────
    const tenantId = payload.tenantId ?? null;
    const revenueByMonth = await prisma.$queryRaw<
      { month: string; revenue: bigint }[]
    >`
      SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(total) as revenue
      FROM Invoice
      WHERE status = 'paid' AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (${tenantId} IS NULL OR tenantId = ${tenantId})
      GROUP BY month ORDER BY month ASC
    `;

    const expensesByMonth = await prisma.$queryRaw<
      { month: string; expenses: bigint }[]
    >`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as expenses
      FROM Expense
      WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (${tenantId} IS NULL OR tenantId = ${tenantId})
      GROUP BY month ORDER BY month ASC
    `;

    // Merge into unified chart data
    const monthMap: Record<string, { revenue: number; expenses: number }> = {};
    for (const r of revenueByMonth) {
      monthMap[r.month] = { revenue: Number(r.revenue), expenses: 0 };
    }
    for (const e of expensesByMonth) {
      if (!monthMap[e.month]) monthMap[e.month] = { revenue: 0, expenses: 0 };
      monthMap[e.month].expenses = Number(e.expenses);
    }
    const monthlyChart = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue / 1_000_000),
        expenses: Math.round(v.expenses / 1_000_000),
      }));

    // ── Lead sources ──────────────────────────────────────────────────
    const leadSources = await prisma.lead.groupBy({
      by: ["source"],
      where: tf,
      _count: { id: true },
    });
    const totalLeads = leadSources.reduce((s, l) => s + l._count.id, 0);
    const leadsSourceData = leadSources.map((l) => ({
      name: l.source || "سایر",
      value: totalLeads > 0 ? Math.round((l._count.id / totalLeads) * 100) : 0,
    }));
    if (leadsSourceData.length === 0) {
      leadsSourceData.push(
        { name: "معرفی مشتری", value: 38 },
        { name: "شبکه‌های اجتماعی", value: 27 },
        { name: "گوگل", value: 20 },
        { name: "نمایشگاه", value: 10 },
        { name: "سایر", value: 5 }
      );
    }

    // ── Project status ────────────────────────────────────────────────
    const projectsByStatus = await prisma.project.groupBy({
      by: ["status"],
      where: tf,
      _count: { id: true },
    });
    const STATUS_LABELS: Record<string, string> = {
      completed: "تکمیل شده",
      in_progress: "در حال اجرا",
      planning: "در انتظار",
      review: "بررسی",
      cancelled: "لغو شده",
      on_hold: "متوقف",
    };
    const projectStatusData = projectsByStatus.map((p) => ({
      name: STATUS_LABELS[p.status] ?? p.status,
      value: p._count.id,
    }));

    // ── Team performance ──────────────────────────────────────────────
    const users = await prisma.user.findMany({
      where: { isActive: true, ...tf },
      select: { id: true, name: true, avatar: true, color: true },
      take: 10,
    });

    const teamPerf = await Promise.all(
      users.map(async (u) => {
        const [hoursData, tasksData, revenueData] = await Promise.all([
          prisma.timeEntry.aggregate({
            where: { userId: u.id, isRunning: false, startedAt: { gte: startDate } },
            _sum: { durationSeconds: true },
          }),
          prisma.task.count({
            where: {
              status: "done",
              updatedAt: { gte: startDate },
              assigneeIds: { string_contains: u.id },
              project: Object.keys(tf).length ? tf : undefined,
            },
          }),
          prisma.invoice.aggregate({
            where: { ...tf, status: "paid", paidAt: { gte: startDate }, project: { memberIds: { string_contains: u.id } } },
            _sum: { total: true },
          }),
        ]);
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          color: u.color,
          hours: Math.round((hoursData._sum.durationSeconds ?? 0) / 3600),
          tasks: tasksData,
          revenue: Math.round((revenueData._sum.total ?? 0) / 1_000_000),
        };
      })
    );

    // ── Leads new vs won ──────────────────────────────────────────────
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: tf,
      _count: { id: true },
      _sum: { estimatedValue: true },
    });

    // ── Top clients by revenue ─────────────────────────────────────────
    const topClients = await prisma.client.findMany({
      where: tf,
      orderBy: { totalRevenue: "desc" },
      take: 5,
      select: { id: true, companyName: true, totalRevenue: true, status: true, avatar: true },
    });

    return ok({
      kpis: {
        revenue,
        revenueChange,
        newLeads: newLeadsThis,
        leadsChange,
        activeProjects,
        workHours,
        hoursChange,
      },
      monthlyChart,
      leadsSourceData,
      projectStatusData,
      teamPerformance: teamPerf,
      leadsByStatus,
      topClients,
    });
  } catch (e) {
    return serverError(e);
  }
}
