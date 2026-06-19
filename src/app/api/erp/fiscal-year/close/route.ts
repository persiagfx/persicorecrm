import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

/**
 * بستن سال مالی — closing entries:
 *  ۱. انتقال مانده حساب‌های درآمد (۴xxx) به سود انباشته (۳۰۰۲)
 *  ۲. انتقال مانده حساب‌های هزینه (۵xxx) از سود انباشته (۳۰۰۲)
 * در پایان، مانده حساب‌های درآمد و هزینه صفر می‌شود.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const body = await req.json();

    const year: number = body.year;
    if (!year || year < 2000 || year > 2100) {
      return badRequest("سال مالی معتبر نیست");
    }

    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);

    // حساب سود انباشته
    const retainedEarnings = await prisma.chartOfAccount.findFirst({
      where: { ...tf, code: "3002" },
    });
    if (!retainedEarnings) {
      return badRequest("حساب ۳۰۰۲ (سود انباشته) یافت نشد. کدینگ استاندارد را بارگذاری کنید.");
    }

    // محاسبه مانده حساب‌های درآمد و هزینه
    const revenueAccounts = await prisma.chartOfAccount.findMany({
      where: { ...tf, code: { startsWith: "4" } },
    });
    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: { ...tf, code: { startsWith: "5" } },
    });

    const allAccountIds = [...revenueAccounts, ...expenseAccounts].map(a => a.id);

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        ...tf,
        date: { gte: from, lt: to },
        OR: [
          { debitAccountId: { in: allAccountIds } },
          { creditAccountId: { in: allAccountIds } },
        ],
      },
      select: { debitAccountId: true, creditAccountId: true, amount: true },
    });

    // محاسبه مانده خالص هر حساب
    const balanceMap = new Map<string, number>();
    for (const entry of ledgerEntries) {
      balanceMap.set(entry.debitAccountId, (balanceMap.get(entry.debitAccountId) ?? 0) + entry.amount);
      balanceMap.set(entry.creditAccountId, (balanceMap.get(entry.creditAccountId) ?? 0) - entry.amount);
    }

    const closingDate = new Date(year, 11, 29); // ۲۹ اسفند
    const closingRef = `closing:${year}`;

    // حذف اسناد بستن قبلی (idempotent)
    await prisma.ledgerEntry.deleteMany({
      where: { ...tf, reference: closingRef },
    });

    const closingEntries: {
      tenantId: string | null; date: Date; description: string;
      debitAccountId: string; creditAccountId: string;
      amount: number; reference: string; entityType: string; entityId: string;
      createdById: string;
    }[] = [];

    let totalRevenue = 0;
    let totalExpenses = 0;

    // بستن حساب‌های درآمد: بدهکار درآمد / بستانکار سود انباشته
    for (const acc of revenueAccounts) {
      const netBalance = -(balanceMap.get(acc.id) ?? 0); // درآمد دارای مانده بستانکار (منفی در map ما)
      if (netBalance <= 0) continue;
      totalRevenue += netBalance;
      closingEntries.push({
        tenantId: payload.tenantId ?? null,
        date: closingDate,
        description: `بستن سال مالی ${year} — ${acc.nameFa}`,
        debitAccountId: acc.id,
        creditAccountId: retainedEarnings.id,
        amount: netBalance,
        reference: closingRef,
        entityType: "closing",
        entityId: `${year}:${acc.id}`,
        createdById: payload.userId,
      });
    }

    // بستن حساب‌های هزینه: بدهکار سود انباشته / بستانکار هزینه
    for (const acc of expenseAccounts) {
      const netBalance = balanceMap.get(acc.id) ?? 0; // هزینه دارای مانده بدهکار
      if (netBalance <= 0) continue;
      totalExpenses += netBalance;
      closingEntries.push({
        tenantId: payload.tenantId ?? null,
        date: closingDate,
        description: `بستن سال مالی ${year} — ${acc.nameFa}`,
        debitAccountId: retainedEarnings.id,
        creditAccountId: acc.id,
        amount: netBalance,
        reference: closingRef,
        entityType: "closing",
        entityId: `${year}:${acc.id}`,
        createdById: payload.userId,
      });
    }

    if (closingEntries.length === 0) {
      return badRequest("هیچ مانده‌ای برای بستن یافت نشد. اطمینان حاصل کنید که اسناد برای این سال ثبت شده‌اند.");
    }

    await prisma.ledgerEntry.createMany({ data: closingEntries });

    return ok({
      year,
      closingEntriesCount: closingEntries.length,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    });
  } catch (e) { return serverError(e); }
}

/** GET — پیش‌نمایش بستن سال: مانده‌های جاری بدون ثبت */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);

    const [revenueAccounts, expenseAccounts] = await Promise.all([
      prisma.chartOfAccount.findMany({ where: { ...tf, code: { startsWith: "4" } } }),
      prisma.chartOfAccount.findMany({ where: { ...tf, code: { startsWith: "5" } } }),
    ]);

    const allIds = [...revenueAccounts, ...expenseAccounts].map(a => a.id);
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        ...tf, date: { gte: from, lt: to },
        OR: [{ debitAccountId: { in: allIds } }, { creditAccountId: { in: allIds } }],
      },
      select: { debitAccountId: true, creditAccountId: true, amount: true },
    });

    const balanceMap = new Map<string, number>();
    for (const e of entries) {
      balanceMap.set(e.debitAccountId, (balanceMap.get(e.debitAccountId) ?? 0) + e.amount);
      balanceMap.set(e.creditAccountId, (balanceMap.get(e.creditAccountId) ?? 0) - e.amount);
    }

    const revenues = revenueAccounts
      .map(a => ({ code: a.code, name: a.nameFa, balance: -(balanceMap.get(a.id) ?? 0) }))
      .filter(a => a.balance > 0);
    const expenses = expenseAccounts
      .map(a => ({ code: a.code, name: a.nameFa, balance: balanceMap.get(a.id) ?? 0 }))
      .filter(a => a.balance > 0);

    return ok({
      year,
      revenues,
      expenses,
      totalRevenue: revenues.reduce((s, a) => s + a.balance, 0),
      totalExpenses: expenses.reduce((s, a) => s + a.balance, 0),
    });
  } catch (e) { return serverError(e); }
}
