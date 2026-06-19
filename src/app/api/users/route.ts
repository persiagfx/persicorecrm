import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/sms";
import { checkUserLimit } from "@/lib/tenant-limits";
import { checkPlanLimit } from "@/lib/plan-limits";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    // Role-based visibility: sales_manager sees only sales roles
    const MANAGER_VISIBLE_ROLES: Record<string, string[]> = {
      sales_manager: ["sales_rep", "sales_manager"],
    };
    const visibleRoles = MANAGER_VISIBLE_ROLES[payload.role ?? ""];

    const users = await prisma.user.findMany({
      where: {
        ...tenantFilter(payload),
        ...(visibleRoles ? { role: { in: visibleRoles } } : {}),
      },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, color: true,
        walletBalance: true, joinedAt: true, isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return ok(users);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند کاربر بسازد" }, { status: 403 });

    const body = await req.json();
    if (!body.name || !body.phone)
      return badRequest("نام و شماره موبایل الزامی است");

    const phone = normalizePhone(body.phone);
    if (!isValidPhone(phone)) return badRequest("شماره موبایل معتبر نیست");

    const limitErr = await checkUserLimit(payload);
    if (limitErr) return badRequest(limitErr);

    if (payload.tenantId) {
      const limitCheck = await checkPlanLimit(payload.tenantId, "users");
      if (!limitCheck.allowed) {
        return badRequest(
          `سقف پلن شما تکمیل شده. تعداد کاربران به حداکثر (${limitCheck.limit}) در پلن ${limitCheck.planName} رسیده. برای افزایش محدودیت پلن خود را ارتقا دهید.`
        );
      }
    }

    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) return badRequest("این شماره موبایل قبلاً ثبت شده است");

    const user = await prisma.user.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        phone,
        email: null,
        passwordHash: null,
        role: body.role ?? "sales_rep",
        color: body.color ?? "gold",
      },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, color: true, isActive: true, joinedAt: true,
      },
    });

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
