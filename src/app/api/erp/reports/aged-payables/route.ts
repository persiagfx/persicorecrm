import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

/**
 * گزارش سنی بستانکاران (Aged Payables): دسته‌بندی هزینه‌های تأییدشده پرداخت‌نشده
 * بر اساس روزهای سپری‌شده — جاری / ۱-۳۰ / ۳۱-۶۰ / ۶۱-۹۰ / بیش از ۹۰ روز.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const expenses = await prisma.expense.findMany({
      where: {
        ...tenantFilter(payload),
        approvalStatus: "approved",
      },
      select: {
        id: true, title: true, amount: true, category: true, date: true,
        paidById: true,
      },
      orderBy: { date: "asc" },
    });

    const now = Date.now();
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    const byCategory: Record<string, { category: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number }> = {};

    const rows = expenses.map((exp) => {
      const daysElapsed = Math.floor((now - new Date(exp.date).getTime()) / 86_400_000);
      let bucket: keyof typeof buckets;
      if (daysElapsed <= 0) bucket = "current";
      else if (daysElapsed <= 30) bucket = "d1_30";
      else if (daysElapsed <= 60) bucket = "d31_60";
      else if (daysElapsed <= 90) bucket = "d61_90";
      else bucket = "d90plus";
      buckets[bucket] += exp.amount;

      const cat = exp.category ?? "other";
      if (!byCategory[cat]) byCategory[cat] = { category: cat, total: 0, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
      byCategory[cat].total += exp.amount;
      byCategory[cat][bucket] += exp.amount;

      return {
        id: exp.id, title: exp.title, category: cat,
        amount: exp.amount, date: exp.date, daysElapsed, bucket,
      };
    });

    const totalPayable = rows.reduce((s, r) => s + r.amount, 0);
    return ok({
      rows,
      byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
      buckets,
      totalPayable,
      count: rows.length,
    });
  } catch (e) {
    return serverError(e);
  }
}
