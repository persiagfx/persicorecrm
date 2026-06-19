import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

/**
 * دفتر کل / معین یک حساب: ریز گردش حساب با ماندهٔ تجمعی (running balance).
 * پارامترها: ?accountId=&from=&to=
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) return badRequest("شناسهٔ حساب الزامی است");
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

    const account = await prisma.chartOfAccount.findFirst({
      where: { id: accountId, ...tenantFilter(payload) },
      select: { id: true, code: true, name: true, nameFa: true, type: true },
    });
    if (!account) return badRequest("حساب یافت نشد");

    // مانده ابتدای دوره (قبل از from)
    let opening = 0;
    if (from) {
      const [pd, pc] = await Promise.all([
        prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { debitAccountId: accountId, date: { lt: from } } }),
        prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { creditAccountId: accountId, date: { lt: from } } }),
      ]);
      opening = (pd._sum.amount ?? 0) - (pc._sum.amount ?? 0);
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        ...tenantFilter(payload),
        OR: [{ debitAccountId: accountId }, { creditAccountId: accountId }],
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: {
        debitAccount: { select: { code: true, nameFa: true, name: true } },
        creditAccount: { select: { code: true, nameFa: true, name: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    let running = opening;
    const rows = entries.map((e) => {
      const isDebit = e.debitAccountId === accountId;
      const debit = isDebit ? e.amount : 0;
      const credit = isDebit ? 0 : e.amount;
      running += debit - credit;
      const counter = isDebit ? e.creditAccount : e.debitAccount;
      return {
        id: e.id,
        date: e.date,
        description: e.description,
        reference: e.reference,
        counterAccount: `${counter.code} — ${counter.nameFa || counter.name}`,
        debit,
        credit,
        balance: running,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return ok({
      account: { ...account, name: account.nameFa || account.name },
      opening,
      rows,
      totalDebit,
      totalCredit,
      closing: running,
    });
  } catch (e) {
    return serverError(e);
  }
}
