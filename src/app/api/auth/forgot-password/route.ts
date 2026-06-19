import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`crm-forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json(
        { error: "تعداد درخواست بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email?.trim()) return badRequest("ایمیل الزامی است");

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always respond with same message to prevent user enumeration
    const response = ok({ message: "اگر این ایمیل در سیستم باشد، لینک بازنشانی ارسال شد." });

    if (!user || !user.isActive) return response;

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    sendPasswordResetEmail(user.email ?? "", token).catch((e) =>
      console.error("[forgot-password] email send failed:", e)
    );

    return response;
  } catch (e) {
    return serverError(e);
  }
}
