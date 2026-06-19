import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const job = await prisma.jobPosting.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        applications: {
          include: { reviewedBy: { select: { id: true, name: true } } },
          orderBy: { appliedAt: "desc" },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!job) return notFound("آگهی شغلی یافت نشد");
    return ok(job);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const job = await prisma.jobPosting.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        department: body.department ?? undefined,
        type: body.type ?? undefined,
        location: body.location ?? undefined,
        description: body.description ?? undefined,
        requirements: body.requirements ?? undefined,
        salaryFrom: body.salaryFrom ?? undefined,
        salaryTo: body.salaryTo ?? undefined,
        status: body.status ?? undefined,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
      },
    });

    return ok(job);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.jobPosting.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
