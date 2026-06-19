import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const [totalPosts, publishedPosts, draftPosts, totalViews, totalCategories, recentPosts] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "published" } }),
      prisma.blogPost.count({ where: { status: "draft" } }),
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.blogCategory.count(),
      prisma.blogPost.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true, title: true, slug: true, status: true,
          views: true, publishedAt: true, updatedAt: true,
          category: { select: { name: true, color: true } },
        },
      }),
    ]);

    return ok({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews: totalViews._sum.views ?? 0,
      totalCategories,
      recentPosts,
    });
  } catch (e) {
    return serverError(e);
  }
}
