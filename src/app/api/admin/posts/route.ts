import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s؀-ۿ]+/g, "-")
    .replace(/[^\w؀-ۿ-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calcReadingTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200); // ~200 کلمه در دقیقه فارسی
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 20));

    const where = status ? { status } : {};

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        select: {
          id: true, title: true, slug: true, status: true,
          featured: true, publishedAt: true, scheduledAt: true,
          views: true, readingTime: true, coverImage: true, tags: true,
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, color: true } },
          createdAt: true, updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(posts, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const body = await req.json();
    if (!body.title) return badRequest("عنوان الزامی است");

    const slug = body.slug?.trim() || slugify(body.title) || `post-${Date.now()}`;

    // بررسی یکتا بودن slug
    const exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (exists) return badRequest("این slug قبلاً استفاده شده است");

    const content = body.content ?? "";
    const readingTime = calcReadingTime(body.mdxContent ?? content);

    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content,
        mdxContent: body.mdxContent,
        contentType: body.contentType ?? "rich",
        coverImage: body.coverImage,
        authorId: payload.userId,
        categoryId: body.categoryId ?? undefined,
        status: body.status ?? "draft",
        featured: body.featured ?? false,
        publishedAt: body.status === "published" ? (body.publishedAt ? new Date(body.publishedAt) : new Date()) : undefined,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        readingTime,
        // SEO پایه
        seoTitle: body.seoTitle,
        seoDesc: body.seoDesc,
        seoKeywords: body.seoKeywords,
        focusKeyword: body.focusKeyword,
        canonicalUrl: body.canonicalUrl,
        noIndex: body.noIndex ?? false,
        noFollow: body.noFollow ?? false,
        // OG
        ogTitle: body.ogTitle,
        ogDesc: body.ogDesc,
        ogImage: body.ogImage ?? body.coverImage,
        // Twitter
        twitterTitle: body.twitterTitle,
        twitterDesc: body.twitterDesc,
        twitterImage: body.twitterImage,
        twitterCard: body.twitterCard ?? "summary_large_image",
        // Schema / Sitemap
        schemaType: body.schemaType ?? "BlogPosting",
        sitemapPriority: body.sitemapPriority ?? 0.7,
        sitemapChangeFreq: body.sitemapChangeFreq ?? "weekly",
        tags: body.tags ?? [],
      },
    });

    return created(post);
  } catch (e) {
    return serverError(e);
  }
}
