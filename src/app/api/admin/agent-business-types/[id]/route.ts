import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, notFound, serverError } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();
    const { id } = await params;

    const body = await req.json();
    const type = await prisma.agentBusinessType.update({ where: { id }, data: body });
    return ok(type);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return unauthorized();
    const { id } = await params;

    await prisma.agentBusinessType.update({ where: { id }, data: { isActive: false } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
