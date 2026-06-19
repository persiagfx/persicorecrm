import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const budget = await prisma.budget.findFirst({
      where: { id, ...tenantFilter(payload) },
      include: {
        account: { select: { id: true, code: true, nameFa: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
    });
    if (!budget) return notFound();
    return ok(budget);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const budget = await prisma.budget.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        year: body.year ? Number(body.year) : undefined,
        period: body.period,
        month: body.month ? Number(body.month) : null,
        accountId: body.accountId ?? null,
        costCenterId: body.costCenterId ?? null,
        amount: body.amount ? Math.round(Number(body.amount)) : undefined,
        notes: body.notes ?? null,
      },
      include: {
        account: { select: { id: true, code: true, nameFa: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
    });
    return ok(budget);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.budget.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
