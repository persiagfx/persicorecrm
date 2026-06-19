import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { signPortalToken } from "@/lib/portal-auth";
import { ok, badRequest, serverError } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`portal-verify-otp:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json({ error: "تعداد تلاش‌های مجاز تمام شد. ۱۵ دقیقه دیگر تلاش کنید." }, { status: 429 });
    }

    const { phone: rawPhone, code } = await req.json();
    if (!rawPhone || !code) return badRequest("شماره موبایل و کد تأیید الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const otp = await prisma.otpCode.findFirst({
      where: { phone, purpose: "portal-login", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return badRequest("کد تأیید نامعتبر یا منقضی شده است. کد جدید درخواست کنید");

    if (otp.attempts >= 3) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date() } });
      return badRequest("تعداد تلاش‌های مجاز تمام شد. کد جدید درخواست کنید");
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });

    if (otp.code !== String(code).trim()) return badRequest("کد تأیید اشتباه است");

    const portalUser = await prisma.portalUser.findUnique({
      where: { phone },
      include: { client: { select: { id: true, companyName: true, contactName: true, avatar: true } } },
    });
    if (!portalUser || !portalUser.isActive) return badRequest("حساب کاربری غیرفعال است");

    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    await prisma.portalUser.update({ where: { id: portalUser.id }, data: { lastLoginAt: new Date() } });

    const token = signPortalToken({ portalUserId: portalUser.id, clientId: portalUser.clientId, role: portalUser.role });

    const response = Response.json({
      data: {
        token,
        user: {
          id: portalUser.id,
          name: portalUser.name,
          phone: portalUser.phone,
          role: portalUser.role,
          clientId: portalUser.clientId,
          client: portalUser.client,
        },
      },
    });

    const cookieHeader = `portal_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
    const r = new Response(response.body, { status: 200, headers: response.headers });
    r.headers.set("Set-Cookie", cookieHeader);
    return r;
  } catch (e) {
    return serverError(e);
  }
}
