import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const journey = await prisma.customerJourney.findFirst({
      where: { id, ...tenantFilter(payload) },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!journey) return notFound("سفر مشتری");
    return ok(journey);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.customerJourney.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!existing) return notFound("سفر مشتری");

    if (body.name !== undefined && !body.name) return badRequest("نام سفر مشتری الزامی است");

    const journey = await prisma.customerJourney.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.persona !== undefined ? { persona: body.persona } : {}),
        ...(body.stages !== undefined ? { stages: body.stages } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return ok(journey);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const existing = await prisma.customerJourney.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!existing) return notFound("سفر مشتری");

    await prisma.customerJourney.delete({ where: { id } });
    return ok({ message: "سفر مشتری حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
