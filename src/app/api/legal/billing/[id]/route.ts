import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const fee = await prisma.legalFee.update({
      where: { id },
      data: {
        caseId: body.caseId ?? null,
        description: body.description,
        feeType: body.feeType,
        amount: Number(body.amount ?? 0),
        billableHours: body.billableHours ? Number(body.billableHours) : null,
        hourlyRate: body.hourlyRate ? Number(body.hourlyRate) : null,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
        notes: body.notes ?? null,
      },
    });

    return ok(fee);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    await prisma.legalFee.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
