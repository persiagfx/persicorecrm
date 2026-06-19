import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;

    const session = await prisma.userSession.findFirst({
      where: { id, userId: payload.userId },
    });

    if (!session) return notFound("جلسه");

    await prisma.userSession.delete({ where: { id } });

    return ok({ revoked: true });
  } catch (e) {
    return serverError(e);
  }
}
