import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { signToken, created, badRequest, serverError } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`crm-register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json(
        { error: "تعداد ثبت‌نام از این آدرس بیش از حد مجاز است. یک ساعت دیگر تلاش کنید." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { companyName, name, industry, industryType, otpCode, method } = body;
    const rawPhone: string = body.phone ?? "";
    const email: string = (body.email ?? "").toLowerCase().trim();
    const password: string = body.password ?? "";

    if (!companyName?.trim()) return badRequest("نام شرکت الزامی است");
    if (!name?.trim()) return badRequest("نام مدیر الزامی است");

    // ساخت slug منحصربه‌فرد
    async function buildSlug(base: string) {
      let s = slugify(base) || "workspace";
      let counter = 1;
      while (await prisma.tenant.findUnique({ where: { slug: s } })) s = `${slugify(base) || "workspace"}-${counter++}`;
      return s;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    if (method === "email") {
      // ثبت‌نام با ایمیل و رمز عبور
      if (!email) return badRequest("ایمیل الزامی است");
      if (!password || password.length < 6) return badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد");

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return badRequest("این ایمیل قبلاً ثبت شده است");

      const passwordHash = await bcrypt.hash(password, 12);
      const slug = await buildSlug(companyName);

      const tenant = await prisma.tenant.create({
        data: { name: companyName.trim(), slug, industry: industry?.trim() || null, industryType: industryType ?? "GENERAL", plan: "trial", status: "active", trialEndsAt },
      });

      const user = await prisma.user.create({
        data: { name: name.trim(), email, phone: null, passwordHash, role: "admin", tenantId: tenant.id },
      });

      const token = signToken({ userId: user.id, email: user.email ?? undefined, role: user.role, tenantId: tenant.id });

      const isProduction = process.env.NODE_ENV === "production";
      const res = created({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, trialEndsAt },
      });
      const response = new Response(res.body, res);
      response.headers.set("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${isProduction ? "; Secure" : ""}`);
      return response;
    }

    // ثبت‌نام با شماره موبایل و OTP
    if (!rawPhone) return badRequest("شماره موبایل الزامی است");
    if (!otpCode?.trim()) return badRequest("کد تأیید الزامی است");

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const otp = await prisma.otpCode.findFirst({
      where: { phone, purpose: "register", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) return badRequest("کد تأیید نامعتبر یا منقضی شده است. کد جدید درخواست کنید");

    if (otp.attempts >= 3) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date() } });
      return badRequest("تعداد تلاش‌های مجاز تمام شد. کد جدید درخواست کنید");
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    if (otp.code !== String(otpCode).trim()) return badRequest("کد تأیید اشتباه است");

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return badRequest("این شماره موبایل قبلاً ثبت شده است");

    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const slug = await buildSlug(companyName);

    const tenant = await prisma.tenant.create({
      data: {
        name: companyName.trim(),
        slug,
        industry: industry?.trim() || null,
        industryType: industryType ?? "GENERAL",
        phone,
        plan: "trial",
        status: "active",
        trialEndsAt,
      },
    });

    const user = await prisma.user.create({
      data: { name: name.trim(), phone, email: null, passwordHash: null, role: "admin", tenantId: tenant.id },
    });

    const token = signToken({ userId: user.id, phone: user.phone ?? undefined, role: user.role, tenantId: tenant.id });

    const isProduction = process.env.NODE_ENV === "production";
    const res = created({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, trialEndsAt },
    });
    const response = new Response(res.body, res);
    response.headers.set("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${isProduction ? "; Secure" : ""}`);
    return response;
  } catch (e) {
    return serverError(e);
  }
}
