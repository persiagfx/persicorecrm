import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const record = await prisma.taxRecord.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        paidAt: (body.paidAt || body.paidDate) ? new Date(body.paidAt ?? body.paidDate) : undefined,
        notes: body.notes ?? undefined,
      },
    });

    return ok(record);
  } catch (e) { return serverError(e); }
}
