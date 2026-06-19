import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const period = searchParams.get("period") ?? undefined;
    const isAdmin = payload.role === "admin" || payload.role === "hr";

    const records = await prisma.performanceKPI.findMany({
      where: {
        ...(isAdmin ? (userId ? { userId } : {}) : { userId: payload.userId }),
        ...(period ? { period } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(records);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.userId || !body.period) return badRequest("کارمند و دوره الزامی است");

    const kpi = await prisma.performanceKPI.create({
      data: {
        userId: body.userId,
        period: body.period,
        goals: body.goals ?? [],
        status: "draft",
      },
    });

    return created(kpi);
  } catch (e) { return serverError(e); }
}
