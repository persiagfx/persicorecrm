import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const accounts = await prisma.bankAccount.findMany({
      where: { ...tenantFilter(payload), isActive: true },
      include: { _count: { select: { transactions: true, checks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(accounts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.bankName?.trim() || !body.accountNumber?.trim()) {
      return badRequest("نام بانک و شماره حساب الزامی است");
    }

    const account = await prisma.bankAccount.create({
      data: {
        name: body.name?.trim() || body.bankName.trim(),
        bankName: body.bankName.trim(),
        accountNumber: body.accountNumber.trim(),
        iban: body.iban ?? null,
        currency: body.currency ?? "IRR",
        balance: Math.round(body.balance ?? 0),
        isActive: true,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(account);
  } catch (e) { return serverError(e); }
}
