import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const assets = await prisma.fixedAsset.findMany({
      where: {
        ...tenantFilter(payload),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { purchaseDate: "desc" },
    });

    const totalValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
    const totalBookValue = assets.reduce((s, a) => s + a.currentValue, 0);

    return ok({ assets, totalValue, totalBookValue });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.name?.trim() || !(body.purchasePrice ?? body.purchaseCost) || !body.purchaseDate) {
      return badRequest("نام دارایی، بهای تمام‌شده و تاریخ خرید الزامی است");
    }

    const purchasePrice = Math.round(body.purchasePrice ?? body.purchaseCost);
    const asset = await prisma.fixedAsset.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name.trim(),
        category: body.category ?? "equipment",
        purchaseDate: new Date(body.purchaseDate),
        purchasePrice,
        currentValue: purchasePrice,
        depreciationRate: body.depreciationRate ?? 20,
        location: body.location ?? null,
        serialNumber: body.serialNumber ?? null,
        status: "active",
        notes: body.notes ?? null,
      },
    });

    return created(asset);
  } catch (e) { return serverError(e); }
}
