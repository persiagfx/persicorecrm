import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const monthParam = searchParams.get("month");
    const month = monthParam ? Number(monthParam) : null;

    const tf = tenantFilter(payload);

    // Period range
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    const periodStart = month ? new Date(year, month - 1, 1) : startOfYear;
    const periodEnd = month ? new Date(year, month, 1) : endOfYear;

    // ── Parallel queries ────────────────────────────────────────────────
    const [
      budgetedAgg,
      actualSpendAgg,
      actualRevenueAgg,
      campaigns,
      expensesByCategory,
      allYearExpenses,
      allYearRevenue,
    ] = await Promise.all([
      // Sum of campaign.budget for the period (campaigns that started in period)
      prisma.campaign.aggregate({
        where: { ...tf, startDate: { gte: periodStart, lt: periodEnd } },
        _sum: { budget: true },
      }),

      // Sum of expense.amount for the period
      prisma.expense.aggregate({
        where: { ...tf, date: { gte: periodStart, lt: periodEnd } },
        _sum: { amount: true },
      }),

      // Sum of invoice.total where status=paid for the period
      prisma.invoice.aggregate({
        where: { ...tf, status: "paid", paidAt: { gte: periodStart, lt: periodEnd } },
        _sum: { total: true },
      }),

      // All campaigns for the year (budget + metrics.revenue target)
      prisma.campaign.findMany({
        where: { ...tf, startDate: { gte: startOfYear, lt: endOfYear } },
        select: { budget: true, startDate: true, metrics: true },
      }),

      // Expenses grouped by category for the period
      prisma.expense.groupBy({
        by: ["category"],
        where: { ...tf, date: { gte: periodStart, lt: periodEnd } },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),

      // All expenses for the year to build monthly breakdown
      prisma.expense.findMany({
        where: { ...tf, date: { gte: startOfYear, lt: endOfYear } },
        select: { amount: true, date: true },
      }),

      // All paid invoices for the year to build monthly revenue
      prisma.invoice.findMany({
        where: { ...tf, status: "paid", paidAt: { gte: startOfYear, lt: endOfYear } },
        select: { total: true, paidAt: true },
      }),
    ]);

    // ── targetRevenue: sum of campaign.metrics.revenue ──────────────────
    let targetRevenue = 0;
    const budgetMap: Record<number, number> = {};
    for (const c of campaigns) {
      const m = c.metrics as { revenue?: number } | null;
      if (m?.revenue) targetRevenue += m.revenue;
      const mo = new Date(c.startDate).getMonth() + 1;
      budgetMap[mo] = (budgetMap[mo] ?? 0) + c.budget;
    }

    // ── Monthly expense map ─────────────────────────────────────────────
    const expenseMap: Record<number, number> = {};
    for (const e of allYearExpenses) {
      const m = new Date(e.date).getMonth() + 1;
      expenseMap[m] = (expenseMap[m] ?? 0) + e.amount;
    }

    // ── Monthly revenue map ─────────────────────────────────────────────
    const revenueMap: Record<number, number> = {};
    for (const inv of allYearRevenue) {
      if (!inv.paidAt) continue;
      const m = new Date(inv.paidAt).getMonth() + 1;
      revenueMap[m] = (revenueMap[m] ?? 0) + inv.total;
    }

    // ── byMonth array ───────────────────────────────────────────────────
    const MONTH_NAMES = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    ];

    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month: MONTH_NAMES[i],
        monthNum: m,
        budgeted: budgetMap[m] ?? 0,
        actual: expenseMap[m] ?? 0,
        revenue: revenueMap[m] ?? 0,
      };
    });

    // ── byCategory ──────────────────────────────────────────────────────
    const byCategory = expensesByCategory.map((row) => ({
      category: row.category,
      total: row._sum.amount ?? 0,
      count: row._count.id,
    }));

    return ok({
      budgeted: budgetedAgg._sum.budget ?? 0,
      actualSpend: actualSpendAgg._sum.amount ?? 0,
      actualRevenue: actualRevenueAgg._sum.total ?? 0,
      targetRevenue,
      byMonth,
      byCategory,
    });
  } catch (e) {
    return serverError(e);
  }
}
