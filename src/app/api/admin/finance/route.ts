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
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      invoicesAll,
      thisMonthInvoices,
      lastMonthInvoices,
      expenses,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "paid" } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "paid", paidAt: { gte: startOfMonth } } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "paid", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.invoice.count({ where: { status: "pending" } }),
      prisma.invoice.count({ where: { status: "overdue" } }),
    ]);

    const totalPaidInvoices = await prisma.invoice.count({ where: { status: "paid" } });

    // Monthly revenue + expenses for last 6 months
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const [rev, exp] = await Promise.all([
        prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "paid", paidAt: { gte: start, lte: end } } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: start, lte: end } } }),
      ]);
      revenueByMonth.push({
        month: monthNames[start.getMonth()],
        revenue: rev._sum.total ?? 0,
        expenses: exp._sum.amount ?? 0,
      });
    }

    // Revenue by plan (from tenant payments)
    // revenueByPlan requires prisma db push to be run first (TenantPayment model)
    const revenueByPlan: { plan: string; amount: number }[] = [];

    // Top clients by invoice total
    const clientInvoices = await prisma.invoice.groupBy({
      by: ["clientId"],
      _sum: { total: true },
      where: { status: "paid" },
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    });

    const clientIds = clientInvoices.map(c => c.clientId).filter(Boolean) as string[];
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, companyName: true } });
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.companyName]));

    const topClients = clientInvoices.map(c => ({
      name: clientMap[c.clientId ?? ""] ?? "نامشخص",
      total: c._sum.total ?? 0,
    }));

    return ok({
      totalRevenue: invoicesAll._sum.total ?? 0,
      thisMonthRevenue: thisMonthInvoices._sum.total ?? 0,
      lastMonthRevenue: lastMonthInvoices._sum.total ?? 0,
      pendingPayments: pendingInvoices,
      totalExpenses: expenses._sum.amount ?? 0,
      totalPaidInvoices,
      totalPendingInvoices: pendingInvoices,
      totalOverdueInvoices: overdueInvoices,
      revenueByMonth,
      revenueByPlan,
      topClients,
    });
  } catch (e) {
    return serverError(e);
  }
}
