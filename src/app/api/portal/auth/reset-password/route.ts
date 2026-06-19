import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return badRequest("توکن و رمز جدید الزامی است");
    if (password.length < 6) return badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد");

    const user = await prisma.portalUser.findUnique({
      where: { resetToken: token },
    });

    if (!user) return badRequest("لینک بازنشانی نامعتبر است");
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return badRequest("لینک بازنشانی منقضی شده. لطفاً مجدداً درخواست دهید");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.portalUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return ok({ message: "رمز عبور با موفقیت تغییر یافت" });
  } catch (e) {
    return serverError(e);
  }
}
