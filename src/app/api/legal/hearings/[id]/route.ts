import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const hearing = await prisma.courtHearing.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        court: body.court ?? undefined,
        judge: body.judge ?? undefined,
        notes: body.description ?? body.notes ?? undefined,
        outcome: body.outcome ?? undefined,
        status: body.status ?? undefined,
      },
    });

    return ok(hearing);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.courtHearing.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
