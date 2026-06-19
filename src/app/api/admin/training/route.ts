import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "super_admin") return forbidden();

    const courses = await prisma.trainingCourse.findMany({
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
    if (payload.role !== "super_admin") return forbidden();

    const body = await req.json();
    if (!body.title?.trim()) return badRequest("عنوان الزامی است");

    const course = await prisma.trainingCourse.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        instructor: body.instructor || null,
        duration: body.duration || null,
        category: body.category ?? "technical",
        fileUrl: body.fileUrl || null,
      },
    });

    return created(course);
  } catch (e) { return serverError(e); }
}
