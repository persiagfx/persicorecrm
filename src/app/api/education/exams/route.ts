import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const exams = await prisma.eduExam.findMany({
    where: { tenantId: payload.tenantId },
    include: { course: { select: { title: true } }, _count: { select: { submissions: true } } },
    orderBy: { startAt: "desc" },
  });
  return ok(exams.map(e => ({ ...e, courseName: e.course?.title, submissionsCount: e._count.submissions })));
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { courseId, ...body } = await req.json();
  const exam = await prisma.eduExam.create({
    data: { ...body, tenantId: payload.tenantId, ...(courseId ? { courseId } : {}) },
  });
  return created(exam);
}
