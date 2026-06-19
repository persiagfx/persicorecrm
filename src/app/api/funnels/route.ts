import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  requireAuth,
  ok,
  created,
  badRequest,
  unauthorized,
  serverError,
  tenantFilter,
} from "@/lib/auth";

const DEFAULT_STAGES = [
  { id: "new", name: "جدید", order: 0, color: "#3b82f6" },
  { id: "contacted", name: "تماس گرفته شد", order: 1, color: "#6366f1" },
  { id: "meeting", name: "جلسه", order: 2, color: "#8b5cf6" },
  { id: "proposal", name: "پیشنهاد ارسال شد", order: 3, color: "#a855f7" },
  { id: "negotiation", name: "مذاکره", order: 4, color: "#f59e0b" },
  { id: "won", name: "قرارداد بسته شد", order: 5, color: "#10b981" },
  { id: "lost", name: "از دست رفت", order: 6, color: "#ef4444" },
];

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const funnels = await prisma.salesFunnel.findMany({
      where: tenantFilter(payload),
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return ok(funnels);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام قیف فروش الزامی است");

    const stages = Array.isArray(body.stages) && body.stages.length > 0
      ? body.stages
      : DEFAULT_STAGES;

    // If this is set as default, unset all others first
    if (body.isDefault) {
      await prisma.salesFunnel.updateMany({
        where: { ...tenantFilter(payload), isDefault: true },
        data: { isDefault: false },
      });
    }

    const funnel = await prisma.salesFunnel.create({
      data: {
        name: body.name.trim(),
        stages,
        isDefault: body.isDefault ?? false,
        createdById: payload.userId,
        ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return created(funnel);
  } catch (e) {
    return serverError(e);
  }
}
