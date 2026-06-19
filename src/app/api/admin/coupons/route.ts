import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const coupons = await (prisma as any).coupon.findMany({
      include: { _count: { select: { uses: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(coupons);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const body = await req.json();
    if (!body.code || !body.discountValue) return badRequest("کد و مقدار تخفیف الزامی است");

    const existing = await (prisma as any).coupon.findUnique({ where: { code: body.code.toUpperCase() } });
    if (existing) return badRequest("این کد تخفیف قبلاً ثبت شده است");

    const coupon = await (prisma as any).coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        discountType: body.discountType ?? "percent",
        discountValue: Number(body.discountValue),
        maxUses: body.maxUses ? Number(body.maxUses) : null,
        minAmount: body.minAmount ? Number(body.minAmount) : null,
        applicablePlans: body.applicablePlans ?? [],
        isActive: body.isActive ?? true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return created(coupon);
  } catch (e) {
    return serverError(e);
  }
}
