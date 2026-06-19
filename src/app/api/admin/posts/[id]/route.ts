import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

function calcReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, "");
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    if (!post) return notFound("پست");
    return ok(post);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return notFound("پست");

    // بررسی slug تکراری
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findFirst({ where: { slug: body.slug, id: { not: id } } });
      if (slugExists) return badRequest("این slug قبلاً استفاده شده است");
    }

    const content = body.content ?? existing.content;
    const readingTime = calcReadingTime(body.mdxContent ?? content);

    const wasNotPublished = existing.status !== "published";
    const isNowPublished = body.status === "published";

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.mdxContent !== undefined && { mdxContent: body.mdxContent }),
        ...(body.contentType !== undefined && { contentType: body.contentType }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.tags !== undefined && { tags: body.tags }),
        // SEO
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDesc !== undefined && { seoDesc: body.seoDesc }),
        ...(body.seoKeywords !== undefined && { seoKeywords: body.seoKeywords }),
        ...(body.focusKeyword !== undefined && { focusKeyword: body.focusKeyword }),
        ...(body.canonicalUrl !== undefined && { canonicalUrl: body.canonicalUrl }),
        ...(body.noIndex !== undefined && { noIndex: body.noIndex }),
        ...(body.noFollow !== undefined && { noFollow: body.noFollow }),
        ...(body.ogTitle !== undefined && { ogTitle: body.ogTitle }),
        ...(body.ogDesc !== undefined && { ogDesc: body.ogDesc }),
        ...(body.ogImage !== undefined && { ogImage: body.ogImage }),
        ...(body.twitterTitle !== undefined && { twitterTitle: body.twitterTitle }),
        ...(body.twitterDesc !== undefined && { twitterDesc: body.twitterDesc }),
        ...(body.twitterImage !== undefined && { twitterImage: body.twitterImage }),
        ...(body.twitterCard !== undefined && { twitterCard: body.twitterCard }),
        ...(body.schemaType !== undefined && { schemaType: body.schemaType }),
        ...(body.sitemapPriority !== undefined && { sitemapPriority: body.sitemapPriority }),
        ...(body.sitemapChangeFreq !== undefined && { sitemapChangeFreq: body.sitemapChangeFreq }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        readingTime,
        // اگر تازه publish شد، publishedAt را set کن
        ...(wasNotPublished && isNowPublished && {
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        }),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    return ok(post);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return notFound("پست");

    await prisma.blogPost.delete({ where: { id } });
    return ok({ message: "پست حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
