import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { BCRYPT_ROUNDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token?.trim()) return badRequest("توکن بازنشانی الزامی است");
    if (!password || password.length < 6) return badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد");

    const user = await prisma.user.findUnique({ where: { resetToken: token } });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return badRequest("لینک بازنشانی نامعتبر یا منقضی شده است");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all sessions
    try {
      await prisma.userSession.deleteMany({ where: { userId: user.id } });
    } catch {
      // UserSession table may not exist yet
    }

    return ok({ message: "رمز عبور با موفقیت تغییر کرد. لطفاً وارد شوید." });
  } catch (e) {
    return serverError(e);
  }
}
