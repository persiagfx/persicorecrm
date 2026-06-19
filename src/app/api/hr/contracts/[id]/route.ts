import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const contract = await prisma.employeeContract.update({
      where: { id },
      data: {
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        salary: body.salary,
        position: body.position,
        department: body.department,
        fileUrl: body.fileUrl,
        status: body.status,
        notes: body.notes,
      },
    });

    return ok(contract);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const c = await prisma.employeeContract.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!c) return notFound("قرارداد");
    await prisma.employeeContract.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
