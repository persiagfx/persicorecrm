import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;

    const where = {
      project: { tenantId: payload.tenantId ?? undefined },
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(assigneeId ? { assigneeIds: { string_contains: assigneeId } } : {}),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: { comments: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: [{ status: "asc" }, { order: "asc" }],
    });

    return ok(tasks);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.projectId || !body.title) return badRequest("پروژه و عنوان الزامی است");

    const maxOrder = await prisma.task.aggregate({
      where: { projectId: body.projectId, status: body.status ?? "backlog" },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        projectId: body.projectId,
        parentId: body.parentId,
        title: body.title,
        description: body.description,
        status: body.status ?? "backlog",
        priority: body.priority ?? "medium",
        assigneeIds: body.assigneeIds ?? [],
        tags: body.tags ?? [],
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        estimatedHours: body.estimatedHours,
        order: (maxOrder._max.order ?? 0) + 1,
        columnId: body.columnId,
      },
    });

    return created(task);
  } catch (e) {
    return serverError(e);
  }
}
