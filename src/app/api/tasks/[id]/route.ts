import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const task = await prisma.task.findFirst({ where: { id, project: { tenantId: payload.tenantId ?? undefined } },
      include: {
        comments: { orderBy: { createdAt: "asc" } },
        timeEntries: { orderBy: { startedAt: "desc" } },
      },
    });
    if (!task) return notFound("تسک");
    return ok(task);
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

    const prevTask = await prisma.task.findFirst({ where: { id, project: { tenantId: payload.tenantId ?? undefined } }, select: { assigneeIds: true, title: true } });
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assigneeIds: body.assigneeIds,
        tags: body.tags,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        estimatedHours: body.estimatedHours,
        trackedSeconds: body.trackedSeconds,
        order: body.order,
        columnId: body.columnId,
      },
    });

    // اعلان برای اعضای جدید تسک
    if (body.assigneeIds?.length) {
      const prevIds: string[] = Array.isArray(prevTask?.assigneeIds) ? prevTask.assigneeIds as string[] : [];
      const newAssignees = (body.assigneeIds as string[]).filter((uid: string) => !prevIds.includes(uid) && uid !== payload.userId);
      if (newAssignees.length) {
        const actor = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } });
        for (const uid of newAssignees) {
          createNotification(uid, "task_assigned", "واگذاری تسک",
            `${actor?.name ?? "کاربر"} تسک "${task.title}" را به شما واگذار کرد`, task.id, "task").catch((err) => console.error(err));
        }
      }
    }

    // آپدیت خودکار progress پروژه وقتی status تسک تغییر کرد
    if (body.status !== undefined) {
      const taskStats = await prisma.task.groupBy({
        by: ["status"],
        where: { projectId: task.projectId },
        _count: { id: true },
      });
      const total = taskStats.reduce((s, t) => s + t._count.id, 0);
      const done = taskStats.find((t) => t.status === "done")?._count.id ?? 0;
      if (total > 0) {
        const progress = Math.round((done / total) * 100);
        await prisma.project.update({
          where: { id: task.projectId },
          data: { progress },
        }).catch((err) => console.error(err));
      }
    }

    return ok(task);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return ok({ message: "تسک حذف شد" });
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
      const comment = await prisma.taskComment.create({
        data: { taskId: id, content: body.content, authorId: payload.userId },
      });
      return created(comment);
    }

    return badRequest("عملیات نامعتبر");
  } catch (e) {
    return serverError(e);
  }
}
