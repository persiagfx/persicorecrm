import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true, type: { in: ["revenue", "expense"] } },
      include: {
        debitEntries: {
          where: { date: { gte: from, lte: to } },
          select: { amount: true },
        },
        creditEntries: {
          where: { date: { gte: from, lte: to } },
          select: { amount: true },
        },
      },
    });

    const revenues: { code: string; name: string; amount: number }[] = [];
    const expenses: { code: string; name: string; amount: number }[] = [];

    for (const account of accounts) {
      const debits = account.debitEntries.reduce((s, e) => s + e.amount, 0);
      const credits = account.creditEntries.reduce((s, e) => s + e.amount, 0);
      const amount = account.type === "revenue" ? credits - debits : debits - credits;
      if (account.type === "revenue") revenues.push({ code: account.code, name: account.name, amount });
      else expenses.push({ code: account.code, name: account.name, amount });
    }

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return ok({ from, to, revenues, expenses, totalRevenue, totalExpenses, netIncome });
  } catch (e) { return serverError(e); }
}
