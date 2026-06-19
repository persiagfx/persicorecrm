import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError, BCRYPT_ROUNDS } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, ...tenantFilter(payload) },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, color: true,
        walletBalance: true, joinedAt: true, isActive: true,
      },
    });
    if (!user) return notFound("کاربر");
    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    if (payload.userId !== id && payload.role !== "admin")
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    // اطمینان از اینکه کاربر مقصد در همین tenant است
    const target = await prisma.user.findFirst({ where: { id, ...tenantFilter(payload) }, select: { id: true } });
    if (!target) return notFound("کاربر");

    const body = await req.json();
    const data: Record<string, unknown> = {
      name: body.name, phone: body.phone, avatar: body.avatar, color: body.color,
    };
    if (body.role && payload.role === "admin") data.role = body.role;
    if (body.isActive !== undefined && payload.role === "admin") data.isActive = body.isActive;
    if (body.password) {
      if (body.password.length < 6) return badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد");
      data.passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, color: true, isActive: true,
      },
    });
    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند کاربر را غیرفعال کند" }, { status: 403 });

    const { id } = await params;
    if (payload.userId === id) return badRequest("نمی‌توانید حساب خود را حذف کنید");

    // اطمینان از اینکه کاربر مقصد در همین tenant است
    const user = await prisma.user.findFirst({ where: { id, ...tenantFilter(payload) }, select: { id: true, role: true, isActive: true } });
    if (!user) return notFound("کاربر");

    // بررسی اینکه آخرین admin همین tenant نباشد
    if (user.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true, ...tenantFilter(payload) } });
      if (adminCount <= 1) return badRequest("نمی‌توان آخرین مدیر سیستم را غیرفعال کرد");
    }

    // soft delete — داده‌های تاریخچه حفظ می‌شوند
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return ok({ message: "کاربر غیرفعال شد" });
  } catch (e) {
    return serverError(e);
  }
}
