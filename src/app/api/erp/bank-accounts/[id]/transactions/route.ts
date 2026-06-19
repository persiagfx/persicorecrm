import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const transactions = await prisma.bankTransaction.findMany({
      where: {
        accountId: id,
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      orderBy: { date: "desc" },
    });

    const totalDebit = transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const totalCredit = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);

    return ok({ transactions, totalDebit, totalCredit, net: totalCredit - totalDebit });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    if (!body.type || !body.amount || !body.date) {
      return badRequest("نوع، مبلغ و تاریخ الزامی است");
    }

    const transaction = await prisma.bankTransaction.create({
      data: {
        accountId: id,
        type: body.type,
        amount: Math.round(body.amount),
        date: new Date(body.date),
        description: body.description ?? "",
        reference: body.reference ?? null,
        balance: body.balance ?? 0,
      },
    });

    // Update bank account balance
    await prisma.bankAccount.update({
      where: { id },
      data: {
        balance: {
          increment: body.type === "credit" ? body.amount : -body.amount,
        },
      },
    });

    return created(transaction);
  } catch (e) { return serverError(e); }
}
