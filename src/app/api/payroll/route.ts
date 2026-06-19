import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;

    const records = await prisma.payrollRecord.findMany({
      where: {
        ...tenantFilter(payload),
        ...(period ? { period } : {}),
        ...(userId ? { userId } : payload.role !== "admin" ? { userId: payload.userId } : {}),
      },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    });

    return ok(records);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!["admin", "hr", "accountant"].includes(payload.role))
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();
    if (!body.userId || !body.period) return badRequest("کاربر و دوره الزامی است");

    const netPay = (body.baseSalary ?? 0) + (body.bonus ?? 0) - (body.deductions ?? 0);
    const record = await prisma.payrollRecord.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: body.userId,
        period: body.period,
        baseSalary: body.baseSalary ?? 0,
        bonus: body.bonus ?? 0,
        deductions: body.deductions ?? 0,
        netPay,
        status: "draft",
        notes: body.notes,
      },
    });

    return created(record);
  } catch (e) {
    return serverError(e);
  }
}
