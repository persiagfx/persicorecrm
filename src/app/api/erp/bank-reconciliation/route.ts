import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId") ?? undefined;
    const reconciled = searchParams.get("reconciled");

    const transactions = await prisma.bankTransaction.findMany({
      where: {
        ...tenantFilter(payload),
        ...(accountId ? { accountId } : {}),
        ...(reconciled !== null ? { reconciled: reconciled === "true" } : {}),
      },
      include: { account: { select: { id: true, name: true, bankName: true } } },
      orderBy: { date: "desc" },
      take: 200,
    });

    const accounts = await prisma.bankAccount.findMany({
      where: tenantFilter(payload),
      select: { id: true, name: true, bankName: true, balance: true },
    });

    const unreconciled = transactions.filter(t => !t.reconciled).length;
    const reconciledCount = transactions.filter(t => t.reconciled).length;

    return ok({ transactions, accounts, stats: { unreconciled, reconciledCount, total: transactions.length } });
  } catch (e) { return serverError(e); }
}
