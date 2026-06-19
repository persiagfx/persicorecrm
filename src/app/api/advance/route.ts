import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const isAdmin = ["admin", "accountant", "hr"].includes(payload.role);
    const advances = await prisma.salaryAdvance.findMany({
      where: isAdmin ? { ...tenantFilter(payload) } : { ...tenantFilter(payload), userId: payload.userId },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(advances);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.amount || !body.reason || !body.neededAt)
      return badRequest("مبلغ، دلیل و تاریخ مورد نیاز الزامی است");

    if (body.amount < 1000) return badRequest("حداقل مبلغ مساعده ۱۰۰۰ تومان است");

    const advance = await prisma.salaryAdvance.create({
      data: {
        userId: payload.userId,
        tenantId: payload.tenantId ?? null,
        amount: Number(body.amount),
        reason: body.reason,
        description: body.description,
        neededAt: new Date(body.neededAt),
        status: "pending",
      },
    });

    return created(advance);
  } catch (e) {
    return serverError(e);
  }
}
