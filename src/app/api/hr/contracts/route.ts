import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const contracts = await prisma.employeeContract.findMany({
      where: { ...tenantFilter(payload), ...(userId ? { userId } : {}), ...(status ? { status } : {}) },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(contracts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.userId || !body.position || !body.startDate) return badRequest("کارمند، پست و تاریخ شروع الزامی است");

    const contract = await prisma.employeeContract.create({
      data: {
        tenantId: payload.tenantId ?? null,
        userId: body.userId,
        type: body.type ?? "full_time",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        salary: body.salary ?? 0,
        position: body.position,
        department: body.department ?? null,
        fileUrl: body.fileUrl ?? null,
        status: "active",
        notes: body.notes ?? null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return created(contract);
  } catch (e) { return serverError(e); }
}
