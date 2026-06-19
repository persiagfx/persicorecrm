import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const folders = await prisma.fileFolder.findMany({ where: { ...tenantFilter(payload) }, orderBy: { name: "asc" } });
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
    if (!body.name) return badRequest("نام پوشه الزامی است");

    const folder = await prisma.fileFolder.create({
      data: { name: body.name, parentId: body.parentId ?? null, projectId: body.projectId ?? null, tenantId: payload.tenantId ?? null },
    });
    return created(folder);
  } catch (e) {
    return serverError(e);
  }
}
