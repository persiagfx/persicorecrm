import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const assets = await prisma.iTAsset.findMany({
      where: { tenantId: tid, ...(type ? { type } : {}), ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: assets.length,
      active: assets.filter(a => a.status === "active").length,
      inUse: assets.filter(a => a.status === "in_use").length,
      maintenance: assets.filter(a => a.status === "maintenance").length,
      retired: assets.filter(a => a.status === "retired").length,
      totalValue: assets.reduce((s, a) => s + (a.purchasePrice ?? 0), 0),
    };

    return ok({ assets, stats });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.name) return badRequest("نام دارایی الزامی است");

    const asset = await prisma.iTAsset.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        type: body.type ?? "hardware",
        serialNumber: body.serialNumber ?? null,
        assetTag: body.assetTag ?? null,
        brand: body.brand ?? null,
        model: body.model ?? null,
        status: body.status ?? "active",
        assignedToId: body.assignedToId ?? null,
        location: body.location ?? null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null,
        warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
        notes: body.notes ?? null,
      },
    });

    return created(asset);
  } catch (e) { return serverError(e); }
}
