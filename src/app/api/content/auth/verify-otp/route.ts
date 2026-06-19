import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`content-otp-verify:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json({ error: "تعداد تلاش بیش از حد مجاز است." }, { status: 429 });
    }

    const body = await req.json();
    const rawPhone: string = body.phone ?? "";
    const code: string = String(body.code ?? "").trim();

    if (!rawPhone || !code) return badRequest("شماره موبایل و کد تأیید الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");
    if (!/^\d{6}$/.test(code)) return badRequest("کد تأیید باید ۶ رقم باشد");

    const otp = await prisma.otpCode.findFirst({
      where: { phone, purpose: "content-login", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return badRequest("کد تأیید نامعتبر یا منقضی شده است. کد جدید درخواست کنید");

    if (otp.attempts >= 3) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date() } });
      return badRequest("تعداد تلاش‌های مجاز تمام شد. کد جدید درخواست کنید");
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    if (otp.code !== code) return badRequest("کد تأیید اشتباه است");
    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    let user = await prisma.contentUser.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.contentUser.create({ data: { name: "کاربر", phone, plan: "FREE" } });
    }

    const token = jwt.sign({ userId: user.id, role: "content_user", isContentUser: true, plan: user.plan }, JWT_SECRET, { expiresIn: "30d" });
    return ok({ token, user: { id: user.id, name: user.name, phone: user.phone, plan: user.plan } });
  } catch (e) {
    return serverError(e);
  }
}
