import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

/**
 * تراز آزمایشی چهارستونی (گردش بدهکار/بستانکار + ماندهٔ بدهکار/بستانکار).
 * پارامترها: ?from=&to=
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
    const dateFilter = from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

    const accounts = await prisma.chartOfAccount.findMany({
      where: { ...tenantFilter(payload), isActive: true },
      include: {
        debitEntries: { where: dateFilter, select: { amount: true } },
        creditEntries: { where: dateFilter, select: { amount: true } },
      },
      orderBy: { code: "asc" },
    });

    const rows = accounts.map((a) => {
      const debitTurnover = a.debitEntries.reduce((s, e) => s + e.amount, 0);
      const creditTurnover = a.creditEntries.reduce((s, e) => s + e.amount, 0);
      const net = debitTurnover - creditTurnover;
      return {
        id: a.id,
        code: a.code,
        name: a.nameFa || a.name,
        type: a.type,
        debitTurnover,
        creditTurnover,
        debitBalance: net > 0 ? net : 0,
        creditBalance: net < 0 ? -net : 0,
      };
    }).filter((r) => r.debitTurnover > 0 || r.creditTurnover > 0);

    const totals = rows.reduce(
      (t, r) => ({
        debitTurnover: t.debitTurnover + r.debitTurnover,
        creditTurnover: t.creditTurnover + r.creditTurnover,
        debitBalance: t.debitBalance + r.debitBalance,
        creditBalance: t.creditBalance + r.creditBalance,
      }),
      { debitTurnover: 0, creditTurnover: 0, debitBalance: 0, creditBalance: 0 },
    );

    return ok({
      from,
      to,
      rows,
      totals,
      balanced: totals.debitTurnover === totals.creditTurnover && totals.debitBalance === totals.creditBalance,
    });
  } catch (e) {
    return serverError(e);
  }
}
