import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const form = await prisma.surveyForm.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: { responses: { orderBy: { submittedAt: "desc" } } },
    });
    if (!form) return notFound("فرم");
    return ok(form);
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

    const form = await prisma.surveyForm.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        questions: body.questions,
        status: body.status,
        closedAt: body.status === "closed" ? new Date() : undefined,
      },
    });
    return ok(form);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const form = await prisma.surveyForm.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!form) return notFound("فرم");
    await prisma.surveyForm.delete({ where: { id } });
    return ok({ message: "فرم حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
