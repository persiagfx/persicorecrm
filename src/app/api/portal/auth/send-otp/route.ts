import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/auth";
import { generateOtpCode, normalizePhone, isValidPhone, sendOtpSms } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = await rateLimit(`portal-otp-ip:${ip}`, 5, 60 * 1000);
    if (!ipRl.allowed) {
      return Response.json({ error: "درخواست‌های زیادی ارسال شده. یک دقیقه دیگر تلاش کنید." }, { status: 429 });
    }

    const { phone: rawPhone } = await req.json();
    if (!rawPhone) return badRequest("شماره موبایل الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const phoneRl = await rateLimit(`portal-otp-phone:${phone}`, 1, 60 * 1000);
    if (!phoneRl.allowed) {
      return Response.json({ error: "کد قبلی هنوز معتبر است. یک دقیقه دیگر تلاش کنید." }, { status: 429 });
    }

    const portalUser = await prisma.portalUser.findUnique({ where: { phone } });
    if (!portalUser || !portalUser.isActive) {
      return badRequest("این شماره موبایل در پرتال ثبت نشده است. با پشتیبانی تماس بگیرید.");
    }

    await prisma.otpCode.updateMany({
      where: { phone, purpose: "portal-login", usedAt: null },
      data: { expiresAt: new Date() },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.otpCode.create({ data: { phone, code, purpose: "portal-login", expiresAt } });

    await sendOtpSms(phone, code);

    return ok({ message: "کد تأیید ارسال شد", expiresInSeconds: 120 });
  } catch (e) {
    return serverError(e);
  }
}
