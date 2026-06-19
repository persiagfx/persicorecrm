import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, badRequest, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const account = await prisma.chartOfAccount.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        parent: true,
        children: true,
        debitEntries: { take: 20, orderBy: { date: "desc" } },
        creditEntries: { take: 20, orderBy: { date: "desc" } },
      },
    });

    if (!account) return notFound("حساب یافت نشد");
    return ok(account);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        type: body.type ?? undefined,
        parentId: body.parentId ?? undefined,
        description: body.description ?? undefined,
        isActive: body.isActive ?? undefined,
      },
    });

    return ok(account);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const account = await prisma.chartOfAccount.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: { _count: { select: { children: true, debitEntries: true, creditEntries: true } } },
    });

    if (!account) return notFound("حساب یافت نشد");
    const used = account._count.children + account._count.debitEntries + account._count.creditEntries;
    if (used > 0) return badRequest("این حساب دارای زیرحساب یا تراکنش است و قابل حذف نیست");

    await prisma.chartOfAccount.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
