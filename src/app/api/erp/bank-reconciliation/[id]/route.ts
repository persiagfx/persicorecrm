import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const tx = await prisma.bankTransaction.update({
      where: { id },
      data: {
        reconciled: body.reconciled ?? true,
        reconciledAt: body.reconciled !== false ? new Date() : null,
      },
    });
    return ok(tx);
  } catch (e) { return serverError(e); }
}
