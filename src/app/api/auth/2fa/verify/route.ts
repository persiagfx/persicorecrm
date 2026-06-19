import { NextRequest } from "next/server";
import * as OTPAuth from "otpauth";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { code, action } = await req.json();
    if (!code?.trim()) return badRequest("کد تأیید الزامی است");

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user?.totpSecret) return badRequest("ابتدا 2FA را تنظیم کنید");

    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return badRequest("کد تأیید نامعتبر است");

    if (action === "enable") {
      await prisma.user.update({ where: { id: payload.userId }, data: { totpEnabled: true } });
      return ok({ message: "احراز هویت دو مرحله‌ای فعال شد" });
    }

    if (action === "disable") {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { totpEnabled: false, totpSecret: null },
      });
      return ok({ message: "احراز هویت دو مرحله‌ای غیرفعال شد" });
    }

    return ok({ valid: true });
  } catch (e) {
    return serverError(e);
  }
}
