import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { signPortalToken } from "@/lib/portal-auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`portal-login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json({ error: "تعداد تلاش بیش از حد مجاز است." }, { status: 429 });
    }

    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const password: string = body.password ?? "";

    if (!email || !password) return badRequest("ایمیل و رمز عبور الزامی است");

    const portalUser = await prisma.portalUser.findUnique({
      where: { email },
      include: { client: { select: { id: true, companyName: true, contactName: true, avatar: true } } },
    });
    if (!portalUser || !portalUser.isActive) return unauthorized();
    if (!portalUser.passwordHash) return badRequest("این حساب با شماره موبایل ثبت شده است. با کد OTP وارد شوید.");

    const valid = await bcrypt.compare(password, portalUser.passwordHash);
    if (!valid) return unauthorized();

    await prisma.portalUser.update({ where: { id: portalUser.id }, data: { lastLoginAt: new Date() } });

    const token = signPortalToken({
      portalUserId: portalUser.id,
      clientId: portalUser.clientId,
      role: portalUser.role,
    });

    return ok({
      token,
      user: {
        id: portalUser.id,
        name: portalUser.name,
        phone: portalUser.phone,
        email: portalUser.email,
        role: portalUser.role,
        clientId: portalUser.clientId,
        client: portalUser.client,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
