import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const courses = await prisma.trainingCourse.findMany({
      where: { ...tenantFilter(payload), isActive: true },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(courses);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title?.trim()) return badRequest("عنوان دوره الزامی است");

    const course = await prisma.trainingCourse.create({
      data: {
        title: body.title.trim(),
        description: body.description ?? null,
        instructor: body.instructor ?? null,
        duration: body.duration ?? null,
        category: body.category ?? "technical",
        fileUrl: body.fileUrl ?? null,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(course);
  } catch (e) { return serverError(e); }
}
