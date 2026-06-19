import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const userId = body.userId ?? payload.userId;

    const enrollment = await prisma.trainingEnrollment.upsert({
      where: { courseId_userId: { courseId: id, userId } },
      create: { courseId: id, userId },
      update: {},
    });

    return created(enrollment);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const userId = body.userId ?? payload.userId;

    const enrollment = await prisma.trainingEnrollment.update({
      where: { courseId_userId: { courseId: id, userId } },
      data: {
        completedAt: body.completedAt ? new Date(body.completedAt) : body.completed ? new Date() : undefined,
        score: body.score ?? undefined,
        certificate: body.certificate ?? undefined,
      },
    });

    return ok(enrollment);
  } catch (e) { return serverError(e); }
}
