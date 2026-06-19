import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { signToken, ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 96);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`crm-login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json({ error: "تعداد تلاش بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید." }, { status: 429 });
    }

    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const password: string = body.password ?? "";

    if (!email || !password) return badRequest("ایمیل و رمز عبور الزامی است");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return unauthorized();
    if (!user.passwordHash) return badRequest("این حساب با شماره موبایل ثبت شده است. با کد OTP وارد شوید.");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return unauthorized();

    let tenantData = null;
    if (user.tenantId) {
      tenantData = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { id: true, name: true, plan: true, status: true, trialEndsAt: true, maxUsers: true, maxClients: true, industryType: true },
      });
      if (tenantData?.status === "suspended") return badRequest("دسترسی این workspace تعلیق شده است.");
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
