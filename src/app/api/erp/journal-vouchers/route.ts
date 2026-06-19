import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const vouchers = await prisma.journalVoucher.findMany({
      where: { ...tf, ...(status ? { status } : {}) },
      include: {
        lines: {
          include: { account: { select: { code: true, nameFa: true } } },
        },
        createdBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { number: "desc" }],
    });

    return ok(vouchers);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const tf = tenantFilter(payload);
    const body = await req.json();

    if (!body.date || !body.description?.trim()) {
      return badRequest("تاریخ و شرح سند الزامی است");
    }

    const lines: { accountId: string; debit: number; credit: number; note?: string }[] = body.lines ?? [];
    if (lines.length < 2) return badRequest("سند باید حداقل دو ردیف داشته باشد");

    const totalDebit = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (totalDebit !== totalCredit) {
      return badRequest(`سند متوازن نیست: بدهکار ${totalDebit} ≠ بستانکار ${totalCredit}`);
    }
    if (totalDebit <= 0) return badRequest("مبلغ سند باید بزرگتر از صفر باشد");

    // شماره سند بعدی برای این tenant
    const lastVoucher = await prisma.journalVoucher.findFirst({
      where: tf,
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (lastVoucher?.number ?? 0) + 1;

    const voucher = await prisma.journalVoucher.create({
      data: {
        tenantId: payload.tenantId ?? null,
        number: nextNumber,
        date: new Date(body.date),
        description: body.description.trim(),
        status: "draft",
        createdById: payload.userId,
        lines: {
          create: lines.map(l => ({
            accountId: l.accountId,
            debit: Math.round(l.debit ?? 0),
            credit: Math.round(l.credit ?? 0),
            note: l.note ?? null,
          })),
        },
      },
      include: {
        lines: { include: { account: { select: { code: true, nameFa: true } } } },
      },
    });

    return created(voucher);
  } catch (e) { return serverError(e); }
}
