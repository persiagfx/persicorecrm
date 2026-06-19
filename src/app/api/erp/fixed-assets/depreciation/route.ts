import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export interface DepreciationYear {
  year: number;
  annual: number;
  accumulated: number;
  bookValue: number;
}

export interface AssetDepreciation {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  currentBookValue: number;
  depreciationRate: number;
  usefulLifeYears: number;
  yearlySchedule: DepreciationYear[];
  monthlyAmount: number;
  yearToDateAmount: number;
  status: string;
}

function calcDepreciationSchedule(purchasePrice: number, depreciationRate: number, purchaseDate: Date): {
  schedule: DepreciationYear[];
  currentBookValue: number;
  monthlyAmount: number;
  yearToDateAmount: number;
  usefulLifeYears: number;
} {
  const annualDepreciation = Math.round((purchasePrice * depreciationRate) / 100);
  const monthlyAmount = Math.round(annualDepreciation / 12);
  const usefulLifeYears = depreciationRate > 0 ? Math.ceil(100 / depreciationRate) : 0;

  const schedule: DepreciationYear[] = [];
  let accumulated = 0;
  const purchaseYear = purchaseDate.getFullYear();

  for (let i = 1; i <= usefulLifeYears; i++) {
    const thisYearDep = Math.min(annualDepreciation, purchasePrice - accumulated);
    if (thisYearDep <= 0) break;
    accumulated += thisYearDep;
    schedule.push({
      year: purchaseYear + i,
      annual: thisYearDep,
      accumulated,
      bookValue: Math.max(0, purchasePrice - accumulated),
    });
  }

  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 3600 * 1000);
  const totalDepreciated = Math.min(purchasePrice, Math.round(annualDepreciation * yearsElapsed));
  const currentBookValue = Math.max(0, purchasePrice - totalDepreciated);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const monthsThisYear = now.getMonth() + 1;
  const monthsForYtd = purchaseDate > startOfYear
    ? now.getMonth() - purchaseDate.getMonth() + 1
    : monthsThisYear;
  const yearToDateAmount = Math.max(0, Math.round(monthlyAmount * Math.max(0, monthsForYtd)));

  return { schedule, currentBookValue, monthlyAmount, yearToDateAmount, usefulLifeYears };
}

/** GET — جدول استهلاک همهٔ دارایی‌های فعال */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);

    const assets = await prisma.fixedAsset.findMany({
      where: { ...tf, status: { not: "disposed" } },
      orderBy: { purchaseDate: "asc" },
    });

    let totalMonthly = 0;
    let totalYtd = 0;
    let totalBookValue = 0;

    const result: AssetDepreciation[] = assets.map((a) => {
      const { schedule, currentBookValue, monthlyAmount, yearToDateAmount, usefulLifeYears } =
        calcDepreciationSchedule(a.purchasePrice, a.depreciationRate, a.purchaseDate);

      totalMonthly += monthlyAmount;
      totalYtd += yearToDateAmount;
      totalBookValue += currentBookValue;

      return {
        id: a.id,
        name: a.name,
        category: a.category,
        purchaseDate: a.purchaseDate.toISOString(),
        purchasePrice: a.purchasePrice,
        currentBookValue,
        depreciationRate: a.depreciationRate,
        usefulLifeYears,
        yearlySchedule: schedule,
        monthlyAmount,
        yearToDateAmount,
        status: a.status,
      };
    });

    return ok({ assets: result, summary: { totalMonthly, totalYtd, totalBookValue, assetCount: result.length } });
  } catch (e) { return serverError(e); }
}

/** POST — صدور سند استهلاک ماهانه (idempotent بر اساس period) */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const body = await req.json().catch(() => ({}));

    const now = new Date();
    const year = body.year ?? now.getFullYear();
    const month = body.month ?? (now.getMonth() + 1);
    const period = `depreciation:${year}-${String(month).padStart(2, "0")}`;

    const accounts = await prisma.chartOfAccount.findMany({ where: tf, select: { id: true, code: true } });
    const codeToId = new Map(accounts.map((a) => [a.code, a.id]));

    const depExpenseId = codeToId.get("5105");
    const accumDepId = codeToId.get("1502");
    if (!depExpenseId || !accumDepId) {
      return badRequest("حساب‌های ۵۱۰۵ (هزینهٔ استهلاک) یا ۱۵۰۲ (استهلاک انباشته) یافت نشد. کدینگ استاندارد را بارگذاری کنید.");
    }

    const assets = await prisma.fixedAsset.findMany({
      where: { ...tf, status: { not: "disposed" } },
    });

    const entryDate = new Date(year, month - 1, 28);
    let createdEntries = 0;

    for (const a of assets) {
      const { monthlyAmount } = calcDepreciationSchedule(a.purchasePrice, a.depreciationRate, a.purchaseDate);
      if (monthlyAmount <= 0) continue;

      const ref = `${period}:${a.id.slice(0, 8)}`;

      await prisma.$transaction([
        prisma.ledgerEntry.deleteMany({ where: { ...tf, reference: ref } }),
        prisma.ledgerEntry.create({
          data: {
            tenantId: payload.tenantId ?? null,
            date: entryDate,
            description: `استهلاک ماهانه — ${a.name} (${year}/${String(month).padStart(2, "0")})`,
            debitAccountId: depExpenseId,
            creditAccountId: accumDepId,
            amount: monthlyAmount,
            reference: ref,
            entityType: "depreciation",
            entityId: a.id,
            createdById: payload.userId,
          },
        }),
      ]);
      createdEntries++;
    }

    return ok({ createdEntries, period, year, month });
  } catch (e) { return serverError(e); }
}
