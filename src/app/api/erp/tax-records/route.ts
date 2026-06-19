import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const year = searchParams.get("year");

    const records = await prisma.taxRecord.findMany({
      where: {
        ...tenantFilter(payload),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(year ? { period: { contains: year } } : {}),
      },
      orderBy: [{ dueDate: "asc" }],
    });

    const totalTaxable = records.reduce((s, r) => s + r.taxableAmt, 0);
    const totalTax = records.reduce((s, r) => s + r.taxAmount, 0);
    const totalPaid = records.filter(r => r.status === "paid").reduce((s, r) => s + r.taxAmount, 0);

    return ok({ records, totalTaxable, totalTax, totalPaid, totalUnpaid: totalTax - totalPaid });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.type || !body.taxableAmount) {
      return badRequest("نوع مالیات و درآمد مشمول الزامی است");
    }

    const taxRate = body.taxRate ?? 9;
    const taxableAmt = Math.round(body.taxableAmount);
    const record = await prisma.taxRecord.create({
      data: {
        tenantId: payload.tenantId ?? null,
        type: body.type,
        period: body.period ?? `${body.fiscalYear ?? new Date().getFullYear()}`,
        totalSales: Math.round(body.totalSales ?? taxableAmt),
        taxableAmt,
        taxRate,
        taxAmount: body.taxAmount ? Math.round(body.taxAmount) : Math.round(taxableAmt * taxRate / 100),
        exemptions: Math.round(body.exemptions ?? 0),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: "draft",
        notes: body.notes ?? null,
      },
    });

    return created(record);
  } catch (e) { return serverError(e); }
}
