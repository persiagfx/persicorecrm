import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[\s]+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const categories = await prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { order: "asc" },
    });
    return ok(categories);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const body = await req.json();
    if (!body.name) return badRequest("نام الزامی است");

    const slug = body.slug?.trim() || slugify(body.name);
    const exists = await prisma.blogCategory.findUnique({ where: { slug } });
    if (exists) return badRequest("این slug قبلاً استفاده شده است");

    const category = await prisma.blogCategory.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        color: body.color ?? "#8B5CF6",
        order: body.order ?? 0,
      },
    });

    return created(category);
  } catch (e) {
    return serverError(e);
  }
}
