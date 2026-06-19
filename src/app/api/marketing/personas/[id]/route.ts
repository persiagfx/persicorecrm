import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const persona = await prisma.marketingPersona.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        avatar: body.avatar ?? undefined,
        age: body.age ?? body.ageRange ?? undefined,
        job: body.job ?? body.jobTitle ?? undefined,
        goals: body.goals ?? undefined,
        painPoints: body.painPoints ?? undefined,
        channels: body.channels ?? undefined,
        description: body.description ?? undefined,
      },
    });

    return ok(persona);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.marketingPersona.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
