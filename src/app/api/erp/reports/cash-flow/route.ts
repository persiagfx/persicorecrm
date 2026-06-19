import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

    const transactions = await prisma.bankTransaction.findMany({
      where: { date: { gte: from, lte: to } },
      include: { account: { select: { bankName: true, currency: true } } },
      orderBy: { date: "asc" },
    });

    const inflows = transactions.filter(t => t.type === "credit");
    const outflows = transactions.filter(t => t.type === "debit");
    const totalInflow = inflows.reduce((s, t) => s + t.amount, 0);
    const totalOutflow = outflows.reduce((s, t) => s + t.amount, 0);

    const byMonth: Record<string, { inflow: number; outflow: number; net: number }> = {};
    for (const t of transactions) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { inflow: 0, outflow: 0, net: 0 };
      if (t.type === "credit") byMonth[key].inflow += t.amount;
      else byMonth[key].outflow += t.amount;
      byMonth[key].net = byMonth[key].inflow - byMonth[key].outflow;
    }

    return ok({
      from,
      to,
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
      byMonth: Object.entries(byMonth).map(([month, data]) => ({ month, ...data })),
      transactions,
    });
  } catch (e) { return serverError(e); }
}
