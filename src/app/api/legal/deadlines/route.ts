import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("documentId") ?? searchParams.get("caseId") ?? undefined;
    const overdue = searchParams.get("overdue") === "true";
    const upcoming = searchParams.get("upcoming");

    const now = new Date();
    const upcomingDays = upcoming ? parseInt(upcoming) : null;

    const deadlines = await prisma.legalDeadline.findMany({
      where: {
        ...tenantFilter(payload),
        ...(caseId ? { caseId } : {}),
        ...(overdue ? { dueDate: { lt: now }, isCompleted: false } : {}),
        ...(upcomingDays ? { dueDate: { gte: now, lte: new Date(now.getTime() + upcomingDays * 86400000) }, isCompleted: false } : {}),
      },
      orderBy: { dueDate: "asc" },
    });

    return ok(deadlines);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.documentId || !body.title || !body.dueDate) {
      return badRequest("پرونده، عنوان و موعد الزامی است");
    }

    const deadline = await prisma.legalDeadline.create({
      data: {
        tenantId: payload.tenantId ?? null,
        caseId: body.documentId ?? body.caseId ?? null,
        title: body.title.trim(),
        dueDate: new Date(body.dueDate),
        notes: body.description ?? body.notes ?? null,
        isCompleted: false,
        assignedToId: body.assignedToId ?? null,
      },
    });

    return created(deadline);
  } catch (e) { return serverError(e); }
}
