import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { signToken, ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createHash } from "crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 96);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = await rateLimit(`otp-verify-ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipRl.allowed) {
      return Response.json(
        { error: "تعداد تلاش بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawPhone: string = body.phone ?? "";
    const code: string = String(body.code ?? "").trim();

    if (!rawPhone || !code) return badRequest("شماره موبایل و کد تأیید الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");
    if (!/^\d{6}$/.test(code)) return badRequest("کد تأیید باید ۶ رقم باشد");

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: "login",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return badRequest("کد تأیید نامعتبر یا منقضی شده است. کد جدید درخواست کنید");

    // اگر بیش از ۳ بار اشتباه وارد شده OTP را باطل کن
    if (otp.attempts >= 3) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date() } });
      return badRequest("تعداد تلاش‌های مجاز تمام شد. کد جدید درخواست کنید");
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });

    if (otp.code !== code) return badRequest("کد تأیید اشتباه است");

    // کد صحیح — مصرف شده علامت بزن
    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.isActive) return unauthorized();

    let tenantData = null;
    if (user.tenantId) {
      tenantData = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { id: true, name: true, plan: true, status: true, trialEndsAt: true, maxUsers: true, maxClients: true, industryType: true },
      });
      if (tenantData?.status === "suspended") {
        return badRequest("دسترسی این workspace تعلیق شده است. با پشتیبانی تماس بگیرید.");
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => null);

    const token = signToken({
      userId: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    });

    try {
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          tokenHash: hashToken(token),
          ipAddress: ip ?? null,
          userAgent: req.headers.get("user-agent") ?? null,
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } catch { /* safe fallback */ }

    const res = ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        color: user.color,
        tenantId: user.tenantId ?? null,
        tenant: tenantData,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const response = new Response(res.body, res);
    response.headers.set(
      "Set-Cookie",
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${isProduction ? "; Secure" : ""}`
    );
    return response;
  } catch (e) {
    return serverError(e);
  }
}
