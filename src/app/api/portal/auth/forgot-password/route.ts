import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json(
        { error: "درخواست‌های زیادی ارسال شده. ۱۵ دقیقه دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email) return badRequest("ایمیل الزامی است");

    const user = await prisma.portalUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    // برای جلوگیری از enumeration — همیشه پیام موفق بده
    if (!user || !user.isActive) {
      return ok({ message: "اگر این ایمیل در سیستم ثبت است، لینک بازنشانی ارسال شد" });
    }

    // تولید token تصادفی
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // ۱ ساعت

    await prisma.portalUser.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // ارسال ایمیل (اگر SMTP تنظیم شده باشد)
    await sendPasswordResetEmail(user.email ?? "", token).catch((err) =>
      console.error("[ForgotPassword] email send failed:", err)
    );

    const isDev = process.env.NODE_ENV !== "production";

    return ok({
      message: "اگر این ایمیل در سیستم ثبت است، لینک بازنشانی ارسال شد",
      emailSent: isEmailConfigured(),
      // در حالت dev و بدون SMTP، لینک مستقیم برمی‌گردد
      ...(isDev && !isEmailConfigured() ? { devToken: token, devLink: `/portal/reset-password/${token}` } : {}),
    });
  } catch (e) {
    return serverError(e);
  }
}
