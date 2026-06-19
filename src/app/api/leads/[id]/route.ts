import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { notifyAssignee } from "@/lib/notify";
import { runAutomation } from "@/lib/automation-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, color: true } },
        activities: { orderBy: { createdAt: "desc" } },
        reminders: { where: { isCompleted: false }, orderBy: { dueDate: "asc" } },
      },
    });
    if (!lead) return notFound("لید");
    return ok(lead);
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

    const prevLead = await prisma.lead.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) }, select: { assigneeId: true, columnId: true } });

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        companyName: body.companyName,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        estimatedValue: body.estimatedValue,
        conversionProbability: body.conversionProbability,
        status: body.status,
        columnId: body.columnId,
        assigneeId: body.assigneeId,
        tags: body.tags,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
        source: body.source,
        winLossCategory: body.winLossCategory,
        winLossDescription: body.winLossDescription,
        competitorName: body.competitorName,
      },
      include: { assignee: { select: { name: true } } },
    });

    // اعلان خودکار: اگر lead به شخص جدیدی واگذار شد
    if (body.assigneeId && body.assigneeId !== prevLead?.assigneeId && body.assigneeId !== payload.userId) {
      const actor = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } });
      notifyAssignee(body.assigneeId, actor?.name ?? "کاربر", "lead", lead.companyName, lead.id).catch((err) => console.error(err));
      if (payload.tenantId) {
        runAutomation("lead_assigned", { lead, assigneeId: body.assigneeId }, payload.tenantId).catch((err) => console.error(err));
      }
    }

    // automation: stage changed
    if (body.columnId && body.columnId !== prevLead?.columnId && payload.tenantId) {
      runAutomation(
        "lead_stage_changed",
        { lead, from: prevLead?.columnId ?? "", to: body.columnId },
        payload.tenantId
      ).catch((err) => console.error(err));
    }

    return ok(lead);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const lead = await prisma.lead.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!lead) return notFound("لید");
    await prisma.lead.delete({ where: { id } });
    return ok({ message: "لید حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/leads/[id] - add activity
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    if (body._action === "add_activity") {
      if (!body.content) return badRequest("محتوای فعالیت الزامی است");
      const activity = await prisma.leadActivity.create({
        data: {
          leadId: id,
          type: body.type ?? "note",
          content: body.content,
          authorId: payload.userId,
        },
      });
      return created(activity);
    }

    if (body._action === "convert_to_client") {
      const lead = await prisma.lead.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
      if (!lead) return notFound("لید");

      const client = await prisma.client.create({
        data: {
          companyName: lead.companyName,
          contactName: lead.contactName,
          contactPhone: lead.contactPhone,
          contactEmail: lead.contactEmail ?? undefined,
          tags: lead.tags as string[],
          notes: lead.notes ?? undefined,
        },
      });

      await prisma.lead.update({ where: { id }, data: { status: "won", clientId: client.id } });
      return created(client);
    }

    return badRequest("عملیات نامعتبر");
  } catch (e) {
    return serverError(e);
  }
}
