import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const asset = await prisma.iTAsset.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        serialNumber: body.serialNumber ?? null,
        assetTag: body.assetTag ?? null,
        brand: body.brand ?? null,
        model: body.model ?? null,
        status: body.status,
        assignedToId: body.assignedToId ?? null,
        location: body.location ?? null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null,
        warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
        notes: body.notes ?? null,
      },
    });

    return ok(asset);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    await prisma.iTAsset.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
