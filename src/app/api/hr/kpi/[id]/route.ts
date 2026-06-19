import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const isAdmin = payload.role === "admin" || payload.role === "hr";

    const updateData: Record<string, unknown> = { goals: body.goals, status: body.status };

    if (isAdmin && body._action === "review") {
      updateData.score = body.score;
      updateData.grade = body.grade;
      updateData.reviewedById = payload.userId;
      updateData.reviewNotes = body.reviewNotes;
      updateData.status = "reviewed";
    }

    const kpi = await prisma.performanceKPI.update({ where: { id }, data: updateData });
    return ok(kpi);
  } catch (e) { return serverError(e); }
}
