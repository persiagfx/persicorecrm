import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, payments] = await Promise.all([
      (prisma as any).tenantPayment.count({ where }),
      (prisma as any).tenantPayment.findMany({
        where,
        include: { tenant: { select: { id: true, name: true, slug: true, plan: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const stats = await (prisma as any).tenantPayment.aggregate({
      _sum: { amount: true },
      where: { status: "paid" },
    });
    const pendingCount = await (prisma as any).tenantPayment.count({ where: { status: "pending" } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = await (prisma as any).tenantPayment.aggregate({
      _sum: { amount: true },
      where: { status: "paid", paidAt: { gte: monthStart } },
    });

    return ok(payments, {
      total, page, perPage,
      totalRevenue: stats._sum.amount ?? 0,
      pendingCount,
      monthRevenue: monthRevenue._sum.amount ?? 0,
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const body = await req.json();
    if (!body.tenantId || !body.amount || !body.plan) return badRequest("tenantId، amount و plan الزامی است");

    const payment = await (prisma as any).tenantPayment.create({
      data: {
        tenantId: body.tenantId,
        amount: Number(body.amount),
        plan: body.plan,
        months: body.months ?? 1,
        status: body.status ?? "pending",
        ref: body.ref,
        note: body.note,
        paidAt: body.status === "paid" ? new Date() : null,
      },
    });

    if (body.status === "paid") {
      const planLimits: Record<string, { maxUsers: number; maxClients: number }> = {
        starter: { maxUsers: 5, maxClients: 50 },
        pro: { maxUsers: 15, maxClients: 200 },
        enterprise: { maxUsers: 999, maxClients: 9999 },
      };
      const limits = planLimits[body.plan];
      if (limits) {
        await (prisma as any).tenant.update({
          where: { id: body.tenantId },
          data: { plan: body.plan, ...limits },
        });
      }
    }

    return created(payment);
  } catch (e) {
    return serverError(e);
  }
}
