import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const journeys = await prisma.customerJourney.findMany({
      where: tenantFilter(payload),
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(journeys);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.name) return badRequest("نام سفر مشتری الزامی است");

    const journey = await prisma.customerJourney.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        description: body.description ?? null,
        persona: body.persona ?? null,
        stages: body.stages ?? [],
        createdById: payload.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return created(journey);
  } catch (e) {
    return serverError(e);
  }
}
