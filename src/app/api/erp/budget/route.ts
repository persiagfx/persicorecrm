import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const period = searchParams.get("period") ?? undefined;
    const costCenterId = searchParams.get("costCenterId") ?? undefined;

    const where = {
      ...tenantFilter(payload),
      ...(year ? { year } : {}),
      ...(period ? { period } : {}),
      ...(costCenterId ? { costCenterId } : {}),
    };

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, nameFa: true, type: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ year: "desc" }, { period: "asc" }],
    });

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    return ok(budgets, { total: budgets.length, totalBudget });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.title?.trim() || !body.year || !body.amount) {
      return badRequest("عنوان، سال و مبلغ بودجه الزامی است");
    }

    const budget = await prisma.budget.create({
      data: {
        tenantId: payload.tenantId ?? null,
        title: body.title.trim(),
        year: Number(body.year),
        period: body.period ?? "annual",
        month: body.month ? Number(body.month) : null,
        accountId: body.accountId ?? null,
        costCenterId: body.costCenterId ?? null,
        amount: Math.round(Number(body.amount)),
        notes: body.notes ?? null,
        createdById: payload.userId,
      },
      include: {
        account: { select: { id: true, code: true, nameFa: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
    });
    return created(budget);
  } catch (e) { return serverError(e); }
}
