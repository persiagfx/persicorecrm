import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const checks = await prisma.bankCheck.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        account: { select: { id: true, name: true, bankName: true, accountNumber: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return ok(checks);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.checkNumber?.trim() || !body.amount || !body.dueDate || !body.bankAccountId) {
      return badRequest("شماره چک، مبلغ، تاریخ سررسید و حساب بانکی الزامی است");
    }

    const check = await prisma.bankCheck.create({
      data: {
        checkNumber: body.checkNumber.trim(),
        accountId: body.bankAccountId ?? body.accountId ?? null,
        type: body.type ?? "issued",
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        payee: body.payee ?? "نامشخص",
        description: body.description ?? null,
        status: "pending",
      },
    });

    return created(check);
  } catch (e) { return serverError(e); }
}
