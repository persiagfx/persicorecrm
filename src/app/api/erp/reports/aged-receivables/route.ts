import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

/**
 * گزارش سنی بدهکاران (Aged Receivables): دسته‌بندی فاکتورهای وصول‌نشده بر اساس
 * روزهای سپری‌شده از سررسید — جاری / ۱-۳۰ / ۳۱-۶۰ / ۶۱-۹۰ / بیش از ۹۰ روز.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const invoices = await prisma.invoice.findMany({
      where: {
        ...tenantFilter(payload),
        type: "invoice",
        status: { in: ["sent", "overdue", "partial"] },
        paidAt: null,
      },
      select: {
        id: true, invoiceNumber: true, total: true, dueDate: true, issuedAt: true, status: true,
        client: { select: { id: true, companyName: true } },
        installments: { where: { paidAt: { not: null } }, select: { paidAmount: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const now = Date.now();
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    const byClient: Record<string, { client: string; total: number; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number }> = {};
    const rows = invoices.map((inv) => {
      const paid = inv.installments.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
      const outstanding = inv.total - paid;
      const daysOverdue = Math.floor((now - new Date(inv.dueDate).getTime()) / 86_400_000);
      let bucket: keyof typeof buckets;
      if (daysOverdue <= 0) bucket = "current";
      else if (daysOverdue <= 30) bucket = "d1_30";
      else if (daysOverdue <= 60) bucket = "d31_60";
      else if (daysOverdue <= 90) bucket = "d61_90";
      else bucket = "d90plus";
      buckets[bucket] += outstanding;

      const cName = inv.client?.companyName ?? "—";
      if (!byClient[cName]) byClient[cName] = { client: cName, total: 0, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
      byClient[cName].total += outstanding;
      byClient[cName][bucket] += outstanding;

      return {
        id: inv.id, invoiceNumber: inv.invoiceNumber, client: cName,
        outstanding, dueDate: inv.dueDate, daysOverdue, bucket, status: inv.status,
      };
    });

    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    return ok({
      rows,
      byClient: Object.values(byClient).sort((a, b) => b.total - a.total),
      buckets,
      totalOutstanding,
      count: rows.length,
    });
  } catch (e) {
    return serverError(e);
  }
}
