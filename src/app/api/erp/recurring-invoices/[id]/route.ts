import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const inv = await prisma.invoice.update({
      where: { id },
      data: {
        nextInvoiceDate: body.nextInvoiceDate ? new Date(body.nextInvoiceDate) : undefined,
        recurringInterval: body.recurringInterval ?? undefined,
        isRecurring: body.isRecurring ?? undefined,
      },
    });
    return ok(inv);
  } catch (e) { return serverError(e); }
}
