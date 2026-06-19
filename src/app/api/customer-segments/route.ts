import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const segments = await prisma.customerSegment.findMany({
      where: { ...tenantFilter(payload) },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return ok(segments);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام سگمنت الزامی است");

    const segment = await prisma.customerSegment.create({
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        color: body.color ?? "#8B5CF6",
        filters: body.filters ?? {},
        clientIds: body.clientIds ?? [],
        autoUpdate: body.autoUpdate ?? false,
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(segment);
  } catch (e) { return serverError(e); }
}
