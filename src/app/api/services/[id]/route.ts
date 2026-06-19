import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const service = await prisma.serviceItem.update({
      where: { id },
      data: {
        name: body.name, category: body.category, defaultPrice: body.defaultPrice,
        unit: body.unit, taxRate: body.taxRate, description: body.description,
        isActive: body.isActive,
      },
    });
    return ok(service);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.serviceItem.delete({ where: { id } });
    return ok({ message: "سرویس حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
