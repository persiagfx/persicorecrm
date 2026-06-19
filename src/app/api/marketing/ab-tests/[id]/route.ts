import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const test = await prisma.aBTest.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        variantA: body.variantA ?? undefined,
        variantB: body.variantB ?? undefined,
        metric: body.metric ?? undefined,
        status: body.status ?? undefined,
        statsA: body.statsA ?? undefined,
        statsB: body.statsB ?? undefined,
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
        winner: body.winner ?? undefined,
      },
    });

    return ok(test);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.aBTest.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
