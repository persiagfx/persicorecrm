import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where = {
      ...tenantFilter(payload),
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
      ...(search ? { name: { contains: search } } : {}),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: { client: { select: { id: true, companyName: true } }, milestones: true },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(projects, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name || !body.clientId || !body.startDate || !body.deadline)
      return badRequest("نام پروژه، مشتری، تاریخ شروع و ددلاین الزامی است");

    const project = await prisma.project.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        clientId: body.clientId,
        description: body.description,
        status: body.status ?? "planning",
        budget: body.budget ?? 0,
        startDate: new Date(body.startDate),
        deadline: new Date(body.deadline),
        memberIds: body.memberIds ?? [],
        tags: body.tags ?? [],
        colorHash: body.colorHash ?? "from-violet-500 to-purple-500",
        repoUrl: body.repoUrl,
      },
    });

    await prisma.client.update({
      where: { id: body.clientId },
      data: { projectCount: { increment: 1 } },
    });

    await prisma.activityLog.create({
      data: {
        tenantId: payload.tenantId ?? null,
        actorId: payload.userId,
        action: "create",
        entityType: "project",
        entityId: project.id,
        entityName: project.name,
        description: `پروژه جدید "${project.name}" ایجاد شد`,
      },
    });

    return created(project);
  } catch (e) {
    return serverError(e);
  }
}
