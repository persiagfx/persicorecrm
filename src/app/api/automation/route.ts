import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const rules = await prisma.automationRule.findMany({
      where: { ...tenantFilter(payload) },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return ok(rules);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.name) return badRequest("نام قانون الزامی است");
    if (!body.trigger?.type) return badRequest("نوع تریگر الزامی است");
    if (!Array.isArray(body.actions) || body.actions.length === 0)
      return badRequest("حداقل یک اکشن الزامی است");

    const rule = await prisma.automationRule.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        description: body.description ?? null,
        trigger: body.trigger,
        actions: body.actions,
        isActive: body.isActive ?? true,
        createdById: payload.userId,
      },
    });

    return created(rule);
  } catch (e) {
    return serverError(e);
  }
}
