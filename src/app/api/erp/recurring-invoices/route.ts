import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const recurring = await prisma.invoice.findMany({
      where: { tenantId: payload.tenantId ?? null, isRecurring: true },
      include: { client: { select: { id: true, companyName: true, contactName: true } } },
      orderBy: { nextInvoiceDate: "asc" },
    });

    const now = new Date();
    const dueSoon = recurring.filter(i => i.nextInvoiceDate && new Date(i.nextInvoiceDate) <= new Date(now.getTime() + 7 * 86400000));

    return ok({ recurring, dueSoonCount: dueSoon.length });
  } catch (e) { return serverError(e); }
}

export async function PUT_NEXT_DATE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    const inv = await prisma.invoice.update({
      where: { id: body.id },
      data: { nextInvoiceDate: body.nextInvoiceDate ? new Date(body.nextInvoiceDate) : null, recurringInterval: body.recurringInterval },
    });
    return ok(inv);
  } catch (e) { return serverError(e); }
}
