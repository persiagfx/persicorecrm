import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, notFound, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { id } = await params;
    const item = await prisma.contentGeneration.findUnique({ where: { id } });
    if (!item) return notFound("محتوا");

    const isOwner = payload.isContentUser
      ? item.contentUserId === payload.userId
      : item.crmUserId === payload.userId;
    if (!isOwner) return unauthorized();

    return ok(item);
  } catch (e) {
    return serverError(e);
  }
}

const updateSchema = z.object({
  editedText: z.string().optional(),
  imageUrl: z.string().optional(),
  seoScore: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { id } = await params;
    const item = await prisma.contentGeneration.findUnique({ where: { id } });
    if (!item) return notFound("محتوا");

    const isOwner = payload.isContentUser
      ? item.contentUserId === payload.userId
      : item.crmUserId === payload.userId;
    if (!isOwner) return unauthorized();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

    const updated = await prisma.contentGeneration.update({
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
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    const { id } = await params;
    const item = await prisma.contentGeneration.findUnique({ where: { id } });
    if (!item) return notFound("محتوا");

    const isOwner = payload.isContentUser
      ? item.contentUserId === payload.userId
      : item.crmUserId === payload.userId;
    if (!isOwner) return unauthorized();

    await prisma.contentGeneration.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
