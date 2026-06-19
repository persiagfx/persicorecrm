import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!["admin", "hr", "accountant"].includes(payload.role))
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    const { id } = await params;
    const body = await req.json();

    const netPay = body.baseSalary !== undefined
      ? (body.baseSalary ?? 0) + (body.bonus ?? 0) - (body.deductions ?? 0)
      : undefined;

    const record = await prisma.payrollRecord.update({
      where: { id },
      data: {
        baseSalary: body.baseSalary, bonus: body.bonus, deductions: body.deductions,
        netPay, status: body.status, notes: body.notes,
        paidAt: body.status === "paid" ? new Date() : undefined,
      },
    });

    if (record.status === "paid") {
      await prisma.walletTransaction.create({
        data: {
          userId: record.userId,
          type: "credit",
          amount: record.netPay,
          description: `حقوق ${record.period}`,
        },
      });
      await prisma.user.update({
        where: { id: record.userId },
        data: { walletBalance: { increment: record.netPay } },
      });
    }

    return ok(record);
  } catch (e) {
    return serverError(e);
  }
}
