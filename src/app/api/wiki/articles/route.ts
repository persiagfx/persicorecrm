import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") ?? undefined;
    const search = searchParams.get("search") ?? "";

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 30));

    const where = {
      folder: { tenantId: payload.tenantId ?? undefined },
      ...(folderId ? { folderId } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] } : {}),
    };

    const [total, articles] = await Promise.all([
      prisma.wikiArticle.count({ where }),
      prisma.wikiArticle.findMany({
        where,
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(articles, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.folderId || !body.title) return badRequest("پوشه و عنوان الزامی است");

    const article = await prisma.wikiArticle.create({
      data: {
        folderId: body.folderId,
        title: body.title,
        content: body.content ?? "",
        authorId: payload.userId,
        isPinned: body.isPinned ?? false,
        tags: body.tags ?? [],
      },
    });

    return created(article);
  } catch (e) {
    return serverError(e);
  }
}
