import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const personas = await prisma.marketingPersona.findMany({
      where: { ...tenantFilter(payload) },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(personas);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام پرسونا الزامی است");

    const persona = await prisma.marketingPersona.create({
      data: {
        name: body.name.trim(),
        avatar: body.avatar ?? null,
        age: body.age ?? body.ageRange ?? null,
        job: body.job ?? body.jobTitle ?? null,
        goals: body.goals ?? [],
        painPoints: body.painPoints ?? [],
        channels: body.channels ?? [],
        description: body.description ?? null,
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(persona);
  } catch (e) { return serverError(e); }
}
