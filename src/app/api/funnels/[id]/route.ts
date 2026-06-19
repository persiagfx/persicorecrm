import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  requireAuth,
  ok,
  badRequest,
  unauthorized,
  notFound,
  serverError,
  tenantFilter,
} from "@/lib/auth";

interface StageStats {
  id: string;
  name: string;
  color: string;
  order: number;
  leadCount: number;
  totalValue: number;
  conversionRate: number;
  avgDaysInStage: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;

    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, ...tenantFilter(payload) },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });
    if (!funnel) return notFound("قیف فروش");

    const stages = funnel.stages as Array<{
      id: string;
      name: string;
      color: string;
      order: number;
    }>;

    // Fetch all leads for this tenant
    const leads = await prisma.lead.findMany({
      where: tenantFilter(payload),
      select: {
        id: true,
        status: true,
        columnId: true,
        estimatedValue: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const stageStats: StageStats[] = stages.map((stage, i) => {
      const stageLeads = leads.filter(
        (l) => l.columnId === stage.id || l.status === stage.id
      );

      const prevStage = i > 0 ? stages[i - 1] : null;
      const prevCount = prevStage
        ? leads.filter(
            (l) => l.columnId === prevStage.id || l.status === prevStage.id
          ).length
        : stageLeads.length;

      const conversionRate =
        i === 0
          ? 100
          : prevCount > 0
          ? Math.round((stageLeads.length / prevCount) * 100)
          : 0;

      // Average days in stage: rough estimate using updatedAt - createdAt
      const avgDays =
        stageLeads.length > 0
          ? Math.round(
              stageLeads.reduce((sum, l) => {
                const days =
                  (new Date(l.updatedAt).getTime() -
                    new Date(l.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / stageLeads.length
            )
          : 0;

      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        leadCount: stageLeads.length,
        totalValue: stageLeads.reduce((s, l) => s + l.estimatedValue, 0),
        conversionRate,
        avgDaysInStage: avgDays,
      };
    });

    return ok({ ...funnel, stageStats });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.salesFunnel.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!existing) return notFound("قیف فروش");

    if (body.name !== undefined && !body.name?.trim())
      return badRequest("نام قیف فروش نمی‌تواند خالی باشد");

    // If setting as default, unset others first
    if (body.isDefault) {
      await prisma.salesFunnel.updateMany({
        where: { ...tenantFilter(payload), isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.salesFunnel.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.stages !== undefined ? { stages: body.stages } : {}),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
      },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;

    const existing = await prisma.salesFunnel.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!existing) return notFound("قیف فروش");

    await prisma.salesFunnel.delete({ where: { id } });

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
