import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) return badRequest("رمز عبور فعلی و جدید الزامی است");
    if (newPassword.length < 6) return badRequest("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return unauthorized();

    if (!user.passwordHash) return badRequest("این حساب با OTP ثبت شده است و رمز عبور ندارد");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return badRequest("رمز عبور فعلی اشتباه است");

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

    return ok({ success: true });
  } catch (e) {
    return serverError(e);
  }
}
