import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "super_admin") return forbidden();

    const body = await req.json();
    const course = await prisma.trainingCourse.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.instructor !== undefined && { instructor: body.instructor || null }),
        ...(body.duration !== undefined && { duration: body.duration || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return ok(course);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "super_admin") return forbidden();

    await prisma.trainingCourse.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e);
  }
}
