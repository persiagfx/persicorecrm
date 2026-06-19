import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return ok(category);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    const cat = await prisma.blogCategory.findUnique({ where: { id } });
    if (!cat) return notFound("دسته‌بندی");

    // پست‌های این دسته را بی‌دسته کن
    await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.blogCategory.delete({ where: { id } });
    return ok({ message: "دسته‌بندی حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
