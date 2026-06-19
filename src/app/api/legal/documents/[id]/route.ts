import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const doc = await prisma.legalCase.findUnique({
      where: { id },
      include: {
        lawyer: { select: { id: true, name: true } },
      },
    });

    if (!doc) return notFound("سند حقوقی یافت نشد");
    return ok(doc);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const doc = await prisma.legalCase.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        type: body.type ?? undefined,
        court: body.court ?? undefined,
        defendant: body.opposingParty ?? body.defendant ?? undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
        nextHearing: body.nextHearing ? new Date(body.nextHearing) : undefined,
        lawyerId: body.lawyerId ?? undefined,
      },
    });

    return ok(doc);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.legalCase.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
