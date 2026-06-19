import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 9));
    const categorySlug = searchParams.get("category") ?? undefined;
    const tag = searchParams.get("tag") ?? undefined;
    const featured = searchParams.get("featured") === "true" ? true : undefined;

    const where = {
      status: "published",
      publishedAt: { lte: new Date() },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(tag ? { tags: { array_contains: tag } } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        select: {
          id: true, title: true, slug: true, excerpt: true,
          coverImage: true, publishedAt: true, readingTime: true,
          views: true, featured: true, tags: true,
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(posts, { total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (e) {
    return serverError(e);
  }
}
