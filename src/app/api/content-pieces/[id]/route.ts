import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const piece = await prisma.contentPiece.update({
      where: { id },
      data: {
        title: body.title,
        status: body.status,
        channel: body.channel,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        url: body.url,
        notes: body.notes,
        body: body.body,
        archivedAt: body.archived ? new Date() : (body.archived === false ? null : undefined),
      },
    });
    return ok(piece);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const p = await prisma.contentPiece.findUnique({ where: { id } });
    if (!p) return notFound("محتوا");
    await prisma.contentPiece.delete({ where: { id } });
    return ok({ message: "حذف شد" });
  } catch (e) { return serverError(e); }
}
