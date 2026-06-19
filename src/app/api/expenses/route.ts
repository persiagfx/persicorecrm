import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { expenseSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where = {
      ...tenantFilter(payload),
      ...(status ? { approvalStatus: status } : {}),
      ...(category ? { category } : {}),
    };

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { paidBy: { select: { id: true, name: true, avatar: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(expenses, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const raw = await req.json();
    const parsed = expenseSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("، ");
      return badRequest(msg);
    }
    const body = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        tenantId: payload.tenantId ?? null,
        title: body.title,
        amount: body.amount,
        category: body.category ?? "other",
        date: new Date(body.date),
        paidById: payload.userId,
        receipt: body.receipt,
        notes: body.notes,
        approvalStatus: "pending",
      },
    });

    return created(expense);
  } catch (e) {
    return serverError(e);
  }
}
