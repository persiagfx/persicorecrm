import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError, badRequest } from "@/lib/auth";
import { logActivitySilent } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const client = await prisma.client.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        projects: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { issuedAt: "desc" } },
        reminders: { where: { isCompleted: false }, orderBy: { dueDate: "asc" } },
        contracts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!client) return notFound("مشتری");
    return ok(client);
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

    const before = await prisma.client.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });

    const client = await prisma.client.update({
      where: { id },
      data: {
        companyName: body.companyName,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        address: body.address,
        website: body.website,
        status: body.status,
        tags: body.tags,
        notes: body.notes,
        lastInteractionAt: body.lastInteractionAt ? new Date(body.lastInteractionAt) : undefined,
        anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate) : undefined,
      },
    });

    logActivitySilent({
      actorId: payload.userId,
      action: "update",
      entityType: "client",
      entityId: client.id,
      entityName: client.companyName,
      description: `مشتری "${client.companyName}" ویرایش شد`,
      before: before as Record<string, unknown>,
      after: client as Record<string, unknown>,
      req,
    });

    return ok(client);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return Response.json({ error: "فقط ادمین می‌تواند مشتری را حذف کند" }, { status: 403 });

    const { id } = await params;
    const client = await prisma.client.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!client) return notFound("مشتری");

    const [activeProjects, invoiceCount] = await Promise.all([
      prisma.project.count({ where: { clientId: id, status: { notIn: ["completed", "cancelled"] } } }),
      prisma.invoice.count({ where: { clientId: id } }),
    ]);

    if (activeProjects > 0)
      return badRequest(`مشتری دارای ${activeProjects} پروژه فعال است. ابتدا پروژه‌ها را ببندید`);
    if (invoiceCount > 0)
      return badRequest(`مشتری دارای ${invoiceCount} فاکتور است. امکان حذف وجود ندارد`);

    await prisma.client.delete({ where: { id } });
    return ok({ message: "مشتری حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
