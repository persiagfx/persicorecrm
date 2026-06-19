import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const isAdmin = payload.role === "admin" || payload.role === "hr";

    const benefits = await prisma.employeeBenefit.findMany({
      where: isAdmin ? (userId ? { userId } : {}) : { userId: payload.userId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startDate: "desc" },
    });

    return ok(benefits);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.userId || !body.title || !body.startDate) return badRequest("کارمند، عنوان و تاریخ شروع الزامی است");

    const benefit = await prisma.employeeBenefit.create({
      data: {
        userId: body.userId,
        type: body.type ?? "insurance",
        title: body.title,
        amount: body.amount ?? null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes ?? null,
      },
    });

    return created(benefit);
  } catch (e) { return serverError(e); }
}
