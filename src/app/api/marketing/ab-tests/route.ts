import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tests = await prisma.aBTest.findMany({
      where: { ...tenantFilter(payload) },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(tests);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title?.trim()) {
      return badRequest("عنوان آزمون الزامی است");
    }

    const test = await prisma.aBTest.create({
      data: {
        tenantId: payload.tenantId ?? null,
        title: body.title.trim(),
        campaignId: body.campaignId ?? null,
        variantA: body.variantA ?? {},
        variantB: body.variantB ?? {},
        metric: body.metric ?? "clicks",
        status: "draft",
        createdById: payload.userId,
      },
    });

    return created(test);
  } catch (e) { return serverError(e); }
}
