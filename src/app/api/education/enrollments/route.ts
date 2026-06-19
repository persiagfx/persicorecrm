import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized, badRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const studentId = searchParams.get("studentId");
  const enrollments = await prisma.eduEnrollment.findMany({
    where: {
      tenantId: payload.tenantId,
      ...(courseId ? { courseId } : {}),
      ...(studentId ? { studentId } : {}),
    },
    include: {
      course: { select: { title: true, price: true } },
      student: { select: { name: true, phone: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });
  return ok(enrollments);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const { courseId, studentId } = body;
  if (!courseId || !studentId) return badRequest("courseId و studentId الزامی است");

  const existing = await prisma.eduEnrollment.findUnique({ where: { courseId_studentId: { courseId, studentId } } });
  if (existing) return badRequest("دانش‌آموز قبلاً در این درس ثبت‌نام کرده است");

  const course = await prisma.eduCourse.findUnique({ where: { id: courseId } });
  if (course?.maxStudents) {
    const count = await prisma.eduEnrollment.count({ where: { courseId } });
    if (count >= course.maxStudents) return badRequest("ظرفیت کلاس تکمیل است");
  }

  const enrollment = await prisma.eduEnrollment.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(enrollment);
}
