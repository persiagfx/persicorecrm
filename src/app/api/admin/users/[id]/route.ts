import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, notFound, badRequest, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();

    if (id === payload.userId) return badRequest("نمی‌توانید حساب خود را ویرایش کنید");

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return notFound("کاربر");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: body.isActive ?? undefined,
        role: body.role ?? undefined,
        name: body.name ?? undefined,
      },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true,
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    if (id === payload.userId) return badRequest("نمی‌توانید حساب خود را حذف کنید");

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return ok({ deactivated: true });
  } catch (e) {
    return serverError(e);
  }
}
