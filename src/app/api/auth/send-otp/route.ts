import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { generateOtpCode, normalizePhone, isValidPhone, sendOtpSms } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // حداکثر ۵ درخواست در دقیقه از هر IP
    const ipRl = await rateLimit(`otp-send-ip:${ip}`, 5, 60 * 1000);
    if (!ipRl.allowed) {
      return Response.json(
        { error: "تعداد درخواست بیش از حد مجاز است. یک دقیقه دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawPhone: string = body.phone ?? "";
    const purpose: string = body.purpose ?? "login";

    if (!rawPhone) return badRequest("شماره موبایل الزامی است");
    if (!["login", "register"].includes(purpose)) return badRequest("نوع درخواست نامعتبر است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");

    // حداکثر ۱ کد در ۶۰ ثانیه برای هر شماره
    const phoneRl = await rateLimit(`otp-phone:${phone}`, 1, 60 * 1000);
    if (!phoneRl.allowed) {
      return Response.json(
        { error: "کد قبلاً ارسال شده است. ۶۰ ثانیه صبر کنید." },
        { status: 429 }
      );
    }

    if (purpose === "register") {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) return badRequest("این شماره موبایل قبلاً ثبت شده است");
    }

    // کدهای قدیمی منقضی نشده را باطل کن
    await prisma.otpCode.updateMany({
      where: { phone, purpose, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // ۲ دقیقه

    await prisma.otpCode.create({
      data: { phone, code, purpose, expiresAt },
    });

    const sent = await sendOtpSms(phone, code);
    if (!sent) {
      return Response.json(
        { error: "خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید." },
        { status: 500 }
      );
    }

    return ok({ message: "کد تأیید ارسال شد", expiresInSeconds: 120 });
  } catch (e) {
    return serverError(e);
  }
}
