import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import {
  buildInvoicePostings, buildExpensePostings, buildPayrollPostings, type PostingSpec,
} from "@/lib/finance/posting";

const INVOICE_STATUSES = ["sent", "overdue", "partial", "paid"];

async function fetchPostable(tf: Record<string, unknown>) {
  const [invoices, expenses, payrolls] = await Promise.all([
    prisma.invoice.findMany({
      where: { ...tf, type: "invoice", status: { in: INVOICE_STATUSES } },
      select: { id: true, invoiceNumber: true, subtotal: true, taxAmount: true, total: true, status: true, issuedAt: true, paidAt: true, client: { select: { companyName: true } } },
    }),
    prisma.expense.findMany({
      where: { ...tf, approvalStatus: "approved" },
      select: { id: true, title: true, amount: true, category: true, date: true },
    }),
    prisma.payrollRecord.findMany({
      where: { ...tf, status: "paid" },
      select: { id: true, period: true, baseSalary: true, bonus: true, deductions: true, netPay: true, paidAt: true, user: { select: { name: true } } },
    }),
  ]);
  return { invoices, expenses, payrolls };
}

/** GET — پیش‌نمایش: چند سند قابل صدور است و چند تا قبلاً صادر شده. */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const { invoices, expenses, payrolls } = await fetchPostable(tf);

    const posted = await prisma.ledgerEntry.findMany({
      where: { ...tf, entityType: { in: ["invoice", "expense", "payroll"] } },
      select: { entityType: true, entityId: true },
    });
    const postedSet = new Set(posted.map((p) => `${p.entityType}:${p.entityId}`));
    const unposted = (type: string, ids: string[]) => ids.filter((id) => !postedSet.has(`${type}:${id}`)).length;

    return ok({
      invoices: { total: invoices.length, unposted: unposted("invoice", invoices.map((i) => i.id)) },
      expenses: { total: expenses.length, unposted: unposted("expense", expenses.map((e) => e.id)) },
      payrolls: { total: payrolls.length, unposted: unposted("payroll", payrolls.map((p) => p.id)) },
    });
  } catch (e) { return serverError(e); }
}

/** POST — صدور سند. body: {mode:"all"} یا {entityType, entityId}. idempotent. */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const body = await req.json().catch(() => ({}));

    // نگاشت کد حساب → شناسه
    const accounts = await prisma.chartOfAccount.findMany({ where: tf, select: { id: true, code: true } });
    const codeToId = new Map(accounts.map((a) => [a.code, a.id]));
    if (codeToId.size === 0) {
      return badRequest("هیچ حسابی تعریف نشده است. ابتدا کدینگ استاندارد را در «دفتر حساب‌ها» بارگذاری کنید.");
    }

    const { invoices, expenses, payrolls } = await fetchPostable(tf);

    type Job = { entityType: string; entityId: string; specs: PostingSpec[] };
    let jobs: Job[] = [];

    if (body.entityType && body.entityId) {
      if (body.entityType === "invoice") {
        const inv = invoices.find((i) => i.id === body.entityId);
        if (inv) jobs.push({ entityType: "invoice", entityId: inv.id, specs: buildInvoicePostings({ ...inv, clientName: inv.client?.companyName }) });
      } else if (body.entityType === "expense") {
        const e = expenses.find((x) => x.id === body.entityId);
        if (e) jobs.push({ entityType: "expense", entityId: e.id, specs: buildExpensePostings(e) });
      } else if (body.entityType === "payroll") {
        const p = payrolls.find((x) => x.id === body.entityId);
        if (p) jobs.push({ entityType: "payroll", entityId: p.id, specs: buildPayrollPostings({ ...p, employeeName: p.user?.name }) });
      }
    } else {
      jobs = [
        ...invoices.map((i) => ({ entityType: "invoice", entityId: i.id, specs: buildInvoicePostings({ ...i, clientName: i.client?.companyName }) })),
        ...expenses.map((e) => ({ entityType: "expense", entityId: e.id, specs: buildExpensePostings(e) })),
        ...payrolls.map((p) => ({ entityType: "payroll", entityId: p.id, specs: buildPayrollPostings({ ...p, employeeName: p.user?.name }) })),
      ];
    }

    // بررسی وجود همهٔ کدهای حساب موردنیاز
    const neededCodes = new Set<string>();
    jobs.forEach((j) => j.specs.forEach((s) => { neededCodes.add(s.debitCode); neededCodes.add(s.creditCode); }));
    const missing = [...neededCodes].filter((c) => !codeToId.has(c));
    if (missing.length > 0) {
      return badRequest(`حساب‌های موردنیاز موجود نیست: ${missing.join("، ")}. کدینگ استاندارد را به‌روزرسانی کنید.`);
    }

    let createdEntries = 0;
    let postedDocs = 0;
    for (const job of jobs) {
      if (job.specs.length === 0) continue;
      await prisma.$transaction([
        // حذف اسناد قبلی همان منبع (idempotent)
        prisma.ledgerEntry.deleteMany({ where: { ...tf, entityType: job.entityType, entityId: job.entityId } }),
        ...job.specs.map((s) =>
          prisma.ledgerEntry.create({
            data: {
              tenantId: payload.tenantId ?? null,
              date: s.date,
              description: s.description,
              debitAccountId: codeToId.get(s.debitCode)!,
              creditAccountId: codeToId.get(s.creditCode)!,
              amount: s.amount,
              reference: `${job.entityType}:${job.entityId.slice(0, 8)}`,
              entityType: job.entityType,
              entityId: job.entityId,
              createdById: payload.userId,
            },
          }),
        ),
      ]);
      createdEntries += job.specs.length;
      postedDocs += 1;
    }

    return ok({ postedDocs, createdEntries });
  } catch (e) { return serverError(e); }
}
