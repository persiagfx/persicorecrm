import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const reference = searchParams.get("reference") ?? undefined;

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        ...tenantFilter(payload),
        ...(accountId ? { OR: [{ debitAccountId: accountId }, { creditAccountId: accountId }] } : {}),
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
        ...(reference ? { reference: { contains: reference } } : {}),
      },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return ok(entries);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.debitAccountId || !body.creditAccountId || !body.amount || !body.date) {
      return badRequest("حساب بدهکار، حساب بستانکار، مبلغ و تاریخ الزامی است");
    }
    if (body.debitAccountId === body.creditAccountId) {
      return badRequest("حساب بدهکار و بستانکار نمی‌توانند یکسان باشند");
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        tenantId: payload.tenantId ?? null,
        debitAccountId: body.debitAccountId,
        creditAccountId: body.creditAccountId,
        amount: body.amount,
        date: new Date(body.date),
        description: body.description ?? null,
        reference: body.reference ?? null,
        createdById: payload.userId,
      },
      include: {
        debitAccount: { select: { id: true, code: true, name: true } },
        creditAccount: { select: { id: true, code: true, name: true } },
      },
    });

    return created(entry);
  } catch (e) { return serverError(e); }
}
