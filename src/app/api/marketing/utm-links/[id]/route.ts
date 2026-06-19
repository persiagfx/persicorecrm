import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const link = await prisma.uTMLink.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        clicks: body.clicks ?? undefined,
      },
    });

    return ok(link);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.uTMLink.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
