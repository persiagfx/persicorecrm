import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const ticket = await prisma.ticket.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket) return notFound("تیکت");
    return ok(ticket);
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

    const data: Record<string, unknown> = {
      title: body.title, description: body.description,
      status: body.status, priority: body.priority,
      assigneeId: body.assigneeId, tags: body.tags,
    };
    if (body.status === "resolved") data.resolvedAt = new Date();

    const ticket = await prisma.ticket.update({ where: { id }, data });

    // Auto-create NPS survey when ticket is closed
    if (body.status === "closed" && payload.tenantId) {
      const existing = await prisma.surveyForm.findFirst({
        where: { tenantId: payload.tenantId, type: "nps", status: "active" },
      });
      if (!existing) {
        await prisma.surveyForm.create({
          data: {
            tenantId: payload.tenantId,
            title: "نظرسنجی رضایت مشتری",
            description: "لطفاً تجربه خود را با ما به اشتراک بگذارید",
            type: "nps",
            status: "active",
            questions: [{ id: "nps", type: "nps", text: "چقدر ما را به دیگران توصیه می‌کنید؟", required: true }],
            createdById: payload.userId,
          },
        });
      }
    }

    return ok(ticket);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "add_comment") {
      if (!body.content) return badRequest("محتوا الزامی است");
      const comment = await prisma.ticketComment.create({
        data: { ticketId: id, content: body.content, authorId: payload.userId },
      });
      return created(comment);
    }

    return badRequest("عملیات نامعتبر");
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.ticket.delete({ where: { id } });
    return ok({ message: "تیکت حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
