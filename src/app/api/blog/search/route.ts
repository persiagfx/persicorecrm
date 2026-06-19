import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    if (!q.trim()) return ok([]);

    const posts = await prisma.blogPost.findMany({
      where: {
        status: "published",
        publishedAt: { lte: new Date() },
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { seoKeywords: { contains: q } },
        ],
      },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImage: true, publishedAt: true, readingTime: true,
        category: { select: { name: true, slug: true, color: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    return ok(posts);
  } catch (e) {
    return serverError(e);
  }
}
