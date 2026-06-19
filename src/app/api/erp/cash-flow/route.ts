import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await prisma.bankTransaction.findMany({
      where: { ...tenantFilter(payload), date: { gte: startDate, lte: endDate } },
      select: { type: true, amount: true, date: true },
      orderBy: { date: "asc" },
    });

    const monthly: Record<number, { month: number; inflow: number; outflow: number; net: number }> = {};
    for (let m = 0; m < 12; m++) monthly[m] = { month: m + 1, inflow: 0, outflow: 0, net: 0 };

    for (const tx of transactions) {
      const m = new Date(tx.date).getMonth();
      if (tx.type === "credit") monthly[m].inflow += tx.amount;
      else monthly[m].outflow += tx.amount;
      monthly[m].net = monthly[m].inflow - monthly[m].outflow;
    }

    const months = Object.values(monthly);
    const totalInflow = months.reduce((s, m) => s + m.inflow, 0);
    const totalOutflow = months.reduce((s, m) => s + m.outflow, 0);

    return ok({ year, months, totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow });
  } catch (e) { return serverError(e); }
}
