import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const jobs = await prisma.jobPosting.findMany({
      where: { ...tenantFilter(payload), ...(status ? { status } : {}) },
      include: {
        _count: { select: { applications: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(jobs);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title?.trim()) return badRequest("عنوان شغلی الزامی است");

    const job = await prisma.jobPosting.create({
      data: {
        title: body.title.trim(),
        department: body.department ?? null,
        type: body.type ?? "full_time",
        location: body.location ?? null,
        description: body.description ?? null,
        requirements: body.requirements ?? null,
        salaryFrom: body.salaryFrom ?? null,
        salaryTo: body.salaryTo ?? null,
        status: body.status ?? "open",
        deadline: body.deadline ? new Date(body.deadline) : null,
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(job);
  } catch (e) { return serverError(e); }
}
