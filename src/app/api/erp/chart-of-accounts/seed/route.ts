import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/finance/default-coa";

/**
 * بارگذاری کدینگ استاندارد حسابداری ایران — idempotent.
 * فقط حساب‌هایی که کد آن‌ها از قبل وجود ندارد ایجاد می‌شوند.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const existing = await prisma.chartOfAccount.findMany({
      where: tenantFilter(payload),
      select: { code: true, id: true },
    });
    const byCode = new Map(existing.map((a) => [a.code, a.id]));

    let createdCount = 0;
    // پاس اول: گروه‌ها و حساب‌های بدون والد
    for (const acc of DEFAULT_CHART_OF_ACCOUNTS.filter((a) => !a.parentCode)) {
      if (byCode.has(acc.code)) continue;
      const c = await prisma.chartOfAccount.create({
        data: {
          tenantId: payload.tenantId ?? null,
          code: acc.code, name: acc.name, nameFa: acc.nameFa, type: acc.type,
          description: acc.description ?? null, isActive: true,
        },
      });
      byCode.set(acc.code, c.id);
      createdCount++;
    }
    // پاس دوم: حساب‌های معین با ارجاع به والد
    for (const acc of DEFAULT_CHART_OF_ACCOUNTS.filter((a) => a.parentCode)) {
      if (byCode.has(acc.code)) continue;
      const c = await prisma.chartOfAccount.create({
        data: {
          tenantId: payload.tenantId ?? null,
          code: acc.code, name: acc.name, nameFa: acc.nameFa, type: acc.type,
          parentId: acc.parentCode ? byCode.get(acc.parentCode) ?? null : null,
          description: acc.description ?? null, isActive: true,
        },
      });
      byCode.set(acc.code, c.id);
      createdCount++;
    }

    return ok({ created: createdCount, total: DEFAULT_CHART_OF_ACCOUNTS.length });
  } catch (e) {
    return serverError(e);
  }
}
