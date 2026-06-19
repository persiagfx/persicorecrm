import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const folders = await prisma.wikiFolder.findMany({
      where: { ...tenantFilter(payload) },
      include: { articles: { select: { id: true, title: true, isPinned: true, updatedAt: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    return ok(folders);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name) return badRequest("نام الزامی است");
    const folder = await prisma.wikiFolder.create({
      data: { name: body.name, parentId: body.parentId, order: body.order ?? 0, tenantId: payload.tenantId ?? null },
    });
    return created(folder);
  } catch (e) {
    return serverError(e);
  }
}
