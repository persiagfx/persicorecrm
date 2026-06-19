import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id },
      include: { reviewedBy: { select: { id: true, name: true } } },
      orderBy: { appliedAt: "desc" },
    });

    return ok(applications);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        fullName: body.fullName ?? body.name ?? "نامشخص",
        email: body.email ?? "",
        phone: body.phone ?? null,
        coverLetter: body.coverLetter ?? null,
        resumeUrl: body.resumeUrl ?? null,
        status: "new",
      },
    });

    return created(application);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const application = await prisma.jobApplication.update({
      where: { id: body.applicationId },
      data: {
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return ok(application);
  } catch (e) { return serverError(e); }
}
