import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!["admin", "accountant", "sales_manager"].includes(payload.role))
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        percentage: body.percentage,
        amount: body.amount,
        status: body.status,
        paidAt: body.status === "paid" ? new Date() : undefined,
      },
    });

    // واریز به کیف پول اگر paid شد
    if (body.status === "paid") {
      await prisma.walletTransaction.create({
        data: {
          userId: commission.userId,
          type: "credit",
          amount: commission.amount,
          description: `پورسانت ${commission.period}`,
        },
      });
      await prisma.user.update({
        where: { id: commission.userId },
        data: { walletBalance: { increment: commission.amount } },
      });
    }

    return ok(commission);
  } catch (e) {
    return serverError(e);
  }
}
