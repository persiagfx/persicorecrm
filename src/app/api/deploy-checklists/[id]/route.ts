import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const checklist = await prisma.deployChecklist.findUnique({ where: { id } });
    if (!checklist) return notFound("چک‌لیست");

    const updated = await prisma.deployChecklist.update({
      where: { id },
      data: {
        items: body.items,
        ...(body.deployed ? { deployedAt: new Date(), deployedById: payload.userId } : {}),
      },
    });
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
