import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const tf = tenantFilter(payload);
    const tenantId = payload.tenantId ?? null;

    // ── درآمد و هزینه ماهانه (۶ ماه اخیر) ─────────────────────────
    const revenueByMonth = await prisma.$queryRaw<{ month: string; revenue: bigint }[]>`
      SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(total) as revenue
      FROM Invoice WHERE status = 'paid' AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (${tenantId} IS NULL OR tenantId = ${tenantId})
      GROUP BY month ORDER BY month ASC
    `;
    const expensesByMonth = await prisma.$queryRaw<{ month: string; expenses: bigint }[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as expenses
      FROM Expense WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (${tenantId} IS NULL OR tenantId = ${tenantId})
      GROUP BY month ORDER BY month ASC
    `;
    const payrollByMonth = await prisma.$queryRaw<{ month: string; payroll: bigint }[]>`
      SELECT DATE_FORMAT(paidAt, '%Y-%m') as month, SUM(netPay) as payroll
      FROM PayrollRecord WHERE status = 'paid' AND paidAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (${tenantId} IS NULL OR tenantId = ${tenantId})
      GROUP BY month ORDER BY month ASC
    `;

    const monthMap: Record<string, { revenue: number; expenses: number; payroll: number }> = {};
    for (const r of revenueByMonth) monthMap[r.month] = { revenue: Number(r.revenue), expenses: 0, payroll: 0 };
    for (const e of expensesByMonth) {
      if (!monthMap[e.month]) monthMap[e.month] = { revenue: 0, expenses: 0, payroll: 0 };
      monthMap[e.month].expenses = Number(e.expenses);
    }
    for (const p of payrollByMonth) {
      if (!monthMap[p.month]) monthMap[p.month] = { revenue: 0, expenses: 0, payroll: 0 };
      monthMap[p.month].payroll = Number(p.payroll);
    }
    const monthlyChart = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue / 1_000_000),
        expenses: Math.round((v.expenses + v.payroll) / 1_000_000),
        profit: Math.round((v.revenue - v.expenses - v.payroll) / 1_000_000),
      }));

    // ── KPI امسال ─────────────────────────────────────────────────
    const [revenueAgg, expenseAgg, payrollAgg, activeClients, overdueInvoices] = await Promise.all([
      prisma.invoice.aggregate({ where: { ...tf, status: "paid", paidAt: { gte: startOfYear } }, _sum: { total: true } }),
      prisma.expense.aggregate({ where: { ...tf, date: { gte: startOfYear } }, _sum: { amount: true } }),
      prisma.payrollRecord.aggregate({ where: { ...tf, status: "paid", paidAt: { gte: startOfYear } }, _sum: { netPay: true } }),
      prisma.client.count({ where: { ...tf, status: "active" } }),
      prisma.invoice.findMany({
        where: { ...tf, status: "overdue" },
        select: { id: true, invoiceNumber: true, total: true, dueDate: true, client: { select: { companyName: true } } },
        orderBy: { dueDate: "asc" }, take: 10,
      }),
    ]);

    const revenue = revenueAgg._sum.total ?? 0;
    const expenses = expenseAgg._sum.amount ?? 0;
    const teamShare = payrollAgg._sum.netPay ?? 0;
    const netProfit = revenue - expenses - teamShare;

    // ── سودآوری پروژه‌ها ──────────────────────────────────────────
    const projectRevenue = await prisma.$queryRaw<{ name: string; revenue: bigint; spent: bigint }[]>`
      SELECT p.name, COALESCE(SUM(i.total),0) as revenue, p.spent
      FROM Project p LEFT JOIN Invoice i ON i.projectId = p.id AND i.status = 'paid'
      WHERE p.status != 'cancelled'
        AND (${tenantId} IS NULL OR p.tenantId = ${tenantId})
      GROUP BY p.id, p.name, p.spent ORDER BY revenue DESC LIMIT 6
    `;

    // ── سهم کیف پول تیم ──────────────────────────────────────────
    const teamWallet = await prisma.user.findMany({
      where: { ...tf, isActive: true, walletBalance: { gt: 0 } },
      select: { name: true, walletBalance: true },
      orderBy: { walletBalance: "desc" }, take: 6,
    });

    const totalWallet = teamWallet.reduce((s, u) => s + u.walletBalance, 0);

    return ok({
      summary: { totalRevenue: revenue, totalExpenses: expenses, teamShare, netProfit },
      monthlyChart,
      projectProfitData: projectRevenue.map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
        revenue: Math.round(Number(p.revenue) / 1_000_000),
        cost: Math.round(Number(p.spent) / 1_000_000),
      })),
      teamShareData: teamWallet.map((u) => ({
        name: u.name.split(" ")[0],
        value: totalWallet > 0 ? Math.round((u.walletBalance / totalWallet) * 100) : 0,
      })),
      receivables: overdueInvoices,
    });
  } catch (e) {
    return serverError(e);
  }
}
