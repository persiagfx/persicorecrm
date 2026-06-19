import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId") ?? undefined;
    const upcoming = searchParams.get("upcoming") === "true";

    const hearings = await prisma.courtHearing.findMany({
      where: {
        ...tenantFilter(payload),
        ...(caseId ? { caseId } : {}),
        ...(upcoming ? { date: { gte: new Date() }, outcome: null } : {}),
      },
      include: {
        case: { select: { id: true, title: true, caseNumber: true } },
      },
      orderBy: { date: "asc" },
    });

    return ok(hearings);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.caseId || !body.date) return badRequest("پرونده و تاریخ جلسه الزامی است");

    const hearing = await prisma.courtHearing.create({
      data: {
        tenantId: payload.tenantId ?? null,
        caseId: body.caseId,
        date: new Date(body.date),
        court: body.court ?? "نامشخص",
        judge: body.judge ?? null,
        notes: body.description ?? body.notes ?? null,
      },
    });

    return created(hearing);
  } catch (e) { return serverError(e); }
}
