import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const check = await prisma.bankCheck.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        description: body.notes ?? body.description ?? undefined,
      },
    });

    return ok(check);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const check = await prisma.bankCheck.findUnique({ where: { id } });
    if (!check) return notFound("چک یافت نشد");

    await prisma.bankCheck.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
