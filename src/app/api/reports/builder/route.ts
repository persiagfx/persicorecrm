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

// GET /api/reports/builder — list saved reports for tenant
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tf = tenantFilter(payload);

    const reports = await prisma.savedReport.findMany({
      where: {
        OR: [
          { ...tf },
          { isShared: true, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true, color: true } },
      },
    });

    return ok(reports);
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/reports/builder — create new saved report
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.name || !body.config) return badRequest("name and config are required");

    const report = await prisma.savedReport.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        description: body.description ?? null,
        config: body.config,
        isShared: body.isShared ?? false,
        createdById: payload.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true, color: true } },
      },
    });

    return created(report);
  } catch (e) {
    return serverError(e);
  }
}
