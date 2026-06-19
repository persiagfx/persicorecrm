import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { generateOtpCode, normalizePhone, isValidPhone, sendOtpSms } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`agent-otp-send:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return Response.json({ error: "تعداد درخواست بیش از حد مجاز است. یک دقیقه دیگر تلاش کنید." }, { status: 429 });
    }

    const body = await req.json();
    const rawPhone: string = body.phone ?? "";
    if (!rawPhone) return badRequest("شماره موبایل الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const phoneRl = await rateLimit(`agent-otp-phone:${phone}`, 1, 60 * 1000);
    if (!phoneRl.allowed) {
      return Response.json({ error: "کد قبلاً ارسال شده است. ۶۰ ثانیه صبر کنید." }, { status: 429 });
    }

    await prisma.otpCode.updateMany({
      where: { phone, purpose: "agent-login", usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.otpCode.create({ data: { phone, code, purpose: "agent-login", expiresAt } });

    const sent = await sendOtpSms(phone, code);
    if (!sent) return Response.json({ error: "خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید." }, { status: 500 });

    return ok({ message: "کد تأیید ارسال شد", expiresInSeconds: 120 });
  } catch (e) {
    return serverError(e);
  }
}
