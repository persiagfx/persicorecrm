import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const nodes = await prisma.orgNode.findMany({
      where: { ...tenantFilter(payload) },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true, color: true, isActive: true } },
      },
    });

    return ok(nodes);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    const node = await prisma.orgNode.upsert({
      where: { userId: body.userId },
      create: {
        userId: body.userId,
        tenantId: payload.tenantId ?? null,
        parentId: body.parentId ?? null,
        position: body.position ?? null,
        department: body.department ?? null,
        order: body.order ?? 0,
      },
      update: {
        parentId: body.parentId ?? null,
        position: body.position ?? null,
        department: body.department ?? null,
        order: body.order ?? 0,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true, color: true } },
      },
    });

    return ok(node);
  } catch (e) { return serverError(e); }
}
