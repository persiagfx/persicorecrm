import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: { _count: { select: { posts: { where: { status: "published" } } } } },
      orderBy: { order: "asc" },
    });
    return ok(categories);
  } catch (e) {
    return serverError(e);
  }
}
