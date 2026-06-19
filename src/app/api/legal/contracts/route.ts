import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const contracts = await prisma.legalContract.findMany({
      where: { ...tenantFilter(payload), ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return ok(contracts);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title || !body.startDate)
      return badRequest("عنوان و تاریخ شروع الزامی است");

    const contract = await prisma.legalContract.create({
      data: {
        title: body.title,
        type: body.type ?? "service",
        parties: body.parties ?? [],
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status ?? "draft",
        fileUrl: body.fileUrl,
        notes: body.notes,
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(contract);
  } catch (e) {
    return serverError(e);
  }
}
