import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const template = await prisma.contractTemplate.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!template) return notFound("قالب");

    return ok(template);
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
    if (!body.name?.trim()) return badRequest("نام قالب الزامی است");

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: {
        name: body.name.trim(),
        content: body.content ?? "",
        variables: body.variables ?? [],
      },
    });

    return ok(template);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const used = await prisma.contract.count({ where: { templateId: id } });
    if (used > 0) return badRequest(`این قالب در ${used} قرارداد استفاده شده و قابل حذف نیست`);

    await prisma.contractTemplate.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
