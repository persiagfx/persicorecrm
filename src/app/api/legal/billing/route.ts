import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");

    const [fees, cases] = await Promise.all([
      prisma.legalFee.findMany({
        where: { tenantId: tid, ...(caseId ? { caseId } : {}), ...(status ? { status } : {}) },
        orderBy: { date: "desc" },
      }),
      prisma.legalCase.findMany({
        where: { tenantId: tid },
        select: { id: true, caseNumber: true, title: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = {
      total: fees.reduce((s, f) => s + f.amount, 0),
      pending: fees.filter(f => f.status === "pending").reduce((s, f) => s + f.amount, 0),
      billed: fees.filter(f => f.status === "billed").reduce((s, f) => s + f.amount, 0),
      paid: fees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0),
      totalHours: fees.reduce((s, f) => s + (f.billableHours ?? 0), 0),
    };

    return ok({ fees, cases, stats });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.description) return badRequest("توضیحات الزامی است");

    const fee = await prisma.legalFee.create({
      data: {
        tenantId: payload.tenantId ?? null,
        caseId: body.caseId ?? null,
        description: body.description,
        feeType: body.feeType ?? "fixed",
        amount: Number(body.amount ?? 0),
        billableHours: body.billableHours ? Number(body.billableHours) : null,
        hourlyRate: body.hourlyRate ? Number(body.hourlyRate) : null,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status ?? "pending",
        notes: body.notes ?? null,
      },
    });

    return created(fee);
  } catch (e) { return serverError(e); }
}
