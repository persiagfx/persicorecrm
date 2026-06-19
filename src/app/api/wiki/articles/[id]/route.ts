import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const article = await prisma.wikiArticle.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, avatar: true } }, folder: true },
    });
    if (!article) return notFound("مقاله");
    return ok(article);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const article = await prisma.wikiArticle.update({
      where: { id },
      data: {
        title: body.title, content: body.content,
        isPinned: body.isPinned, tags: body.tags,
        folderId: body.folderId,
      },
    });
    return ok(article);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.wikiArticle.delete({ where: { id } });
    return ok({ message: "مقاله حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
