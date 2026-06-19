import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "published", publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    if (!post) return notFound("پست");

    prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch((err) => console.error(err));

    const related = await prisma.blogPost.findMany({
      where: { id: { not: post.id }, status: "published", publishedAt: { lte: new Date() }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, readingTime: true, views: true, featured: true, tags: true, author: { select: { id: true, name: true, avatar: true } }, category: { select: { name: true, slug: true, color: true } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    return ok({ ...post, related });
  } catch (e) {
    return serverError(e);
  }
}
