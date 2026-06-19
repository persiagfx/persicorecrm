import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, requireRole, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const project = await prisma.project.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        client: { select: { id: true, companyName: true, contactName: true } },
        tasks: { orderBy: [{ status: "asc" }, { order: "asc" }] },
        milestones: { orderBy: { dueDate: "asc" } },
        deployChecklists: true,
        timeEntries: { orderBy: { startedAt: "desc" }, take: 50 },
        invoices: { orderBy: { issuedAt: "desc" } },
        contracts: { orderBy: { createdAt: "desc" } },
        meetings: { orderBy: { startAt: "desc" }, take: 10 },
      },
    });
    if (!project) return notFound("پروژه");
    return ok(project);
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

    // محاسبه خودکار progress از تسک‌ها (اگر progress صراحتاً ارسال نشده)
    let autoProgress: number | undefined = body.progress;
    if (autoProgress === undefined) {
      const taskStats = await prisma.task.groupBy({
        by: ["status"],
        where: { projectId: id },
        _count: { id: true },
      });
      const total = taskStats.reduce((s, t) => s + t._count.id, 0);
      const done = taskStats.find((t) => t.status === "done")?._count.id ?? 0;
      if (total > 0) autoProgress = Math.round((done / total) * 100);
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        progress: autoProgress,
        budget: body.budget,
        spent: body.spent,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        memberIds: body.memberIds,
        tags: body.tags,
        colorHash: body.colorHash,
        repoUrl: body.repoUrl,
        techDocs: body.techDocs,
        servers: body.servers,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorId: payload.userId,
        action: "update",
        entityType: "project",
        entityId: project.id,
        entityName: project.name,
        description: `پروژه "${project.name}" ویرایش شد`,
      },
    });

    return ok(project);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;
    const { id } = await params;

    const project = await prisma.project.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!project) return notFound("پروژه");

    await prisma.project.delete({ where: { id } });
    await prisma.client.update({
      where: { id: project.clientId },
      data: { projectCount: { decrement: 1 } },
    });

    return ok({ message: "پروژه حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
