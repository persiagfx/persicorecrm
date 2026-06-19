import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://blog.persicore.ir";

export async function GET() {
  let posts: { slug: string; updatedAt: Date | string; sitemapPriority?: number | null; sitemapChangeFreq?: string | null; }[] = [];

  try {
    posts = await prisma.blogPost.findMany({
      where: { status: "published", publishedAt: { lte: new Date() } },
      select: { slug: true, updatedAt: true, sitemapPriority: true, sitemapChangeFreq: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    posts = [];
  }

  const staticPages = [
    { url: `${SITE_URL}/blog`, lastmod: new Date().toISOString(), priority: 1.0, changefreq: "daily" },
  ];

  const postPages = posts.map(p => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastmod: typeof p.updatedAt === "string" ? p.updatedAt : p.updatedAt.toISOString(),
    priority: p.sitemapPriority ?? 0.7,
    changefreq: p.sitemapChangeFreq ?? "weekly",
  }));

  const allPages = [...staticPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod.split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
