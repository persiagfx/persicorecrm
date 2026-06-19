import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ??
      (payload.role !== "admin" ? payload.userId : undefined);
    const status = searchParams.get("status") ?? undefined;

    const commissions = await prisma.commission.findMany({
      where: {
        ...tenantFilter(payload),
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        invoices: { include: { invoice: { select: { invoiceNumber: true, total: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(commissions);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!["admin", "accountant"].includes(payload.role))
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();
    if (!body.userId || !body.period || !body.invoiceIds?.length)
      return badRequest("کاربر، دوره و فاکتورها الزامی است");

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: body.invoiceIds }, status: "paid" },
    });
    const totalRevenue = invoices.reduce((s, inv) => s + inv.total, 0);
    const percentage = body.percentage ?? 10;
    const amount = Math.round(totalRevenue * (percentage / 100));

    const commission = await prisma.commission.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: body.userId,
        period: body.period,
        totalRevenue,
        percentage,
        amount,
        status: "pending",
        invoices: { create: body.invoiceIds.map((invoiceId: string) => ({ invoiceId })) },
      },
    });

    return created(commission);
  } catch (e) {
    return serverError(e);
  }
}
