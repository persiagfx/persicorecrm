import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";
import { createExpenseApprovedEntry } from "@/lib/erp/auto-ledger";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {
      title: body.title, amount: body.amount, category: body.category,
      date: body.date ? new Date(body.date) : undefined, notes: body.notes,
    };

    const prevExpense = body.approvalStatus === "approved"
      ? await prisma.expense.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } })
      : null;

    if (body.approvalStatus && payload.role === "admin") {
      data.approvalStatus = body.approvalStatus;
      data.approvedById = payload.userId;
      data.approvedAt = new Date();
    }

    const expense = await prisma.expense.update({ where: { id }, data });

    if (body.approvalStatus === "approved" && prevExpense?.approvalStatus !== "approved") {
      createExpenseApprovedEntry({
        expenseId: expense.id,
        title: expense.title,
        amount: expense.amount,
        createdById: payload.userId,
        date: expense.date,
      }).catch((e) => console.error("[AutoLedger] expense approved entry failed:", e));
    }

    return ok(expense);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const expense = await prisma.expense.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!expense) return notFound("هزینه");
    await prisma.expense.delete({ where: { id } });
    return ok({ message: "هزینه حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
