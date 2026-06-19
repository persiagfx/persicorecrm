import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const templates = await prisma.contractTemplate.findMany({
      where: { ...tenantFilter(payload) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { contracts: true } } },
    });

    return ok(templates);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام قالب الزامی است");

    const template = await prisma.contractTemplate.create({
      data: {
        name: body.name.trim(),
        content: body.content ?? "",
        variables: body.variables ?? [],
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(template);
  } catch (e) {
    return serverError(e);
  }
}
