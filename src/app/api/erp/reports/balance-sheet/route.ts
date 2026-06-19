import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const asOf = searchParams.get("asOf") ? new Date(searchParams.get("asOf")!) : new Date();

    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true, type: { in: ["asset", "liability", "equity"] } },
      include: {
        debitEntries: { where: { date: { lte: asOf } }, select: { amount: true } },
        creditEntries: { where: { date: { lte: asOf } }, select: { amount: true } },
      },
    });

    const grouped: Record<string, { code: string; name: string; balance: number }[]> = {
      asset: [],
      liability: [],
      equity: [],
    };

    for (const account of accounts) {
      const debits = account.debitEntries.reduce((s, e) => s + e.amount, 0);
      const credits = account.creditEntries.reduce((s, e) => s + e.amount, 0);
      const balance = account.type === "asset" ? debits - credits : credits - debits;
      grouped[account.type].push({ code: account.code, name: account.name, balance });
    }

    const totalAssets = grouped.asset.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = grouped.liability.reduce((s, a) => s + a.balance, 0);
    const totalEquity = grouped.equity.reduce((s, a) => s + a.balance, 0);

    return ok({
      asOf,
      assets: grouped.asset,
      liabilities: grouped.liability,
      equity: grouped.equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    });
  } catch (e) { return serverError(e); }
}
