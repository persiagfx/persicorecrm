import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";
import {
  TAX_QUARTERS,
  jalaaliToDate,
  currentJalaaliYear,
  calcVatDeclaration,
  getTaxDeadlines,
} from "@/lib/finance/iran-tax";

/**
 * داشبورد مالیاتی: اظهارنامهٔ ارزش افزودهٔ فصلی (از فاکتورها)، فهرست معاملات فصلی
 * (ماده ۱۶۹) از فاکتورها و هزینه‌ها، و تقویم سررسیدهای مالیاتی.
 *
 * پارامترها: ?year=1404&quarter=1&inputVat=<ریال>
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const jYear = parseInt(searchParams.get("year") ?? "") || currentJalaaliYear();
    const q = (parseInt(searchParams.get("quarter") ?? "") || 1) as 1 | 2 | 3 | 4;
    const inputVatOverride = searchParams.get("inputVat");

    const quarter = TAX_QUARTERS.find((x) => x.q === q) ?? TAX_QUARTERS[0];
    const from = jalaaliToDate(jYear, quarter.startMonth, 1);
    const to = jalaaliToDate(jYear, quarter.endMonth, quarter.endDay);
    to.setHours(23, 59, 59, 999);

    const tf = tenantFilter(payload);

    // ─── فروش‌ها (مالیات فروش / Output VAT) از فاکتورها ───
    const invoices = await prisma.invoice.findMany({
      where: {
        ...tf,
        type: "invoice",
        status: { in: ["sent", "paid", "overdue", "partial"] },
        issuedAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        invoiceNumber: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        issuedAt: true,
        status: true,
        client: { select: { companyName: true } },
      },
      orderBy: { issuedAt: "asc" },
    });

    const sales = invoices.map((i) => ({
      id: i.id,
      ref: i.invoiceNumber,
      party: i.client?.companyName ?? "—",
      base: i.subtotal,
      vat: i.taxAmount,
      total: i.total,
      date: i.issuedAt,
      status: i.status,
    }));

    const outputVat = sales.reduce((s, x) => s + x.vat, 0);
    const totalSalesBase = sales.reduce((s, x) => s + x.base, 0);

    // ─── خریدها / هزینه‌ها (مالیات خرید / Input VAT) ───
    const expenses = await prisma.expense.findMany({
      where: { ...tf, date: { gte: from, lte: to } },
      select: { id: true, title: true, amount: true, category: true, date: true },
      orderBy: { date: "asc" },
    });

    const purchases = expenses.map((e) => ({
      id: e.id,
      ref: e.title,
      party: e.category,
      base: e.amount,
      date: e.date,
    }));
    const totalPurchases = purchases.reduce((s, x) => s + x.base, 0);

    // اعتبار مالیاتی خرید: اگر کاربر مقدار وارد نکند، فرض می‌شود هزینه‌ها فاقد
    // فاکتور رسمی ارزش افزوده هستند (۰). حسابدار می‌تواند مقدار را override کند.
    const inputVat = inputVatOverride != null ? Math.max(0, parseInt(inputVatOverride) || 0) : 0;

    const vatDeclaration = calcVatDeclaration(outputVat, inputVat);

    // ─── تقویم مالیاتی ───
    const today = new Date();
    const deadlines = getTaxDeadlines(jYear).map((d) => ({
      kind: d.kind,
      title: d.title,
      period: d.period,
      jalaaliDue: d.jalaaliDue,
      dueDate: d.dueDate,
      description: d.description,
      overdue: d.dueDate < today,
      daysLeft: Math.ceil((d.dueDate.getTime() - today.getTime()) / 86_400_000),
    }));

    // ─── رکوردهای مالیاتی ثبت‌شده ───
    const records = await prisma.taxRecord.findMany({
      where: { ...tf },
      orderBy: [{ dueDate: "asc" }],
    });
    const totalTax = records.reduce((s, r) => s + r.taxAmount, 0);
    const totalPaid = records.filter((r) => r.status === "paid").reduce((s, r) => s + r.taxAmount, 0);

    return ok({
      year: jYear,
      quarter: q,
      quarterName: quarter.name,
      range: { from, to },
      vat: {
        ...vatDeclaration,
        totalSalesBase,
        totalPurchases,
        salesCount: sales.length,
        purchasesCount: purchases.length,
      },
      sales,
      purchases,
      deadlines,
      records,
      summary: {
        totalTax,
        totalPaid,
        totalUnpaid: totalTax - totalPaid,
        nextDeadline: deadlines.find((d) => !d.overdue) ?? null,
        overdueCount: deadlines.filter((d) => d.overdue).length,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
