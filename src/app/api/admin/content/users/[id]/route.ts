import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["FREE", "PRO", "PLUS"]).optional(),
  isActive: z.boolean().optional(),
  usedThisMonth: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const { id } = await params;
    const user = await prisma.contentUser.findUnique({ where: { id } });
    if (!user) return notFound("کاربر");

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

    const updated = await prisma.contentUser.update({
      where: { id },
      data: parsed.data,
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const { id } = await params;
    await prisma.contentUser.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
