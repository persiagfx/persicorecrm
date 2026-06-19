import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      invoiceStats, paidThisMonth, overdueInvoices,
      bankBalances, payrollThisYear, budgetStats,
    ] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where: { tenantId: payload.tenantId ?? null },
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { tenantId: payload.tenantId ?? null, status: "paid", paidAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: { tenantId: payload.tenantId ?? null, status: { not: "paid" }, dueDate: { lt: now } },
      }),
      prisma.bankAccount.aggregate({
        where: { ...tenantFilter(payload), isActive: true },
        _sum: { balance: true },
        _count: true,
      }),
      prisma.payrollRecord.aggregate({
        where: { tenantId: payload.tenantId ?? null, status: "paid", period: { gte: `${now.getFullYear()}-01` } },
        _sum: { netPay: true },
        _count: true,
      }),
      prisma.budget.aggregate({
        where: { tenantId: payload.tenantId ?? null, year: now.getFullYear() },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const revenueMap: Record<string, number> = {};
    for (const g of invoiceStats) revenueMap[g.status] = g._sum.total ?? 0;

    return ok({
      revenue: {
        total: Object.values(revenueMap).reduce((a, b) => a + b, 0),
        paid: revenueMap["paid"] ?? 0,
        pending: revenueMap["sent"] ?? 0 + (revenueMap["draft"] ?? 0),
        paidThisMonth: paidThisMonth._sum.total ?? 0,
        overdueCount: overdueInvoices,
      },
      banking: {
        totalBalance: bankBalances._sum.balance ?? 0,
        accountCount: bankBalances._count,
      },
      payroll: {
        totalPaidThisYear: payrollThisYear._sum.netPay ?? 0,
        headCount: payrollThisYear._count,
      },
      budget: {
        totalBudget: budgetStats._sum.amount ?? 0,
        budgetCount: budgetStats._count,
      },
    });
  } catch (e) { return serverError(e); }
}
