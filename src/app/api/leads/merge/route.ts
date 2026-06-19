import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { logActivitySilent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { primaryId, duplicateIds } = body as {
      primaryId: string;
      duplicateIds: string[];
    };

    if (!primaryId) return badRequest("primaryId الزامی است");
    if (!Array.isArray(duplicateIds) || duplicateIds.length === 0)
      return badRequest("duplicateIds الزامی است");
    if (duplicateIds.includes(primaryId))
      return badRequest("لید اصلی نمی‌تواند در لیست تکراری‌ها باشد");

    const filter = tenantFilter(payload);

    // Verify primary lead exists and belongs to tenant
    const primaryLead = await prisma.lead.findFirst({
      where: { id: primaryId, ...filter },
    });
    if (!primaryLead) return badRequest("لید اصلی یافت نشد");

    // Verify all duplicates exist and belong to tenant
    const duplicateLeads = await prisma.lead.findMany({
      where: { id: { in: duplicateIds }, ...filter },
    });
    if (duplicateLeads.length !== duplicateIds.length)
      return badRequest("برخی از لیدهای تکراری یافت نشدند");

    // Move activities from duplicates to primary
    await prisma.leadActivity.updateMany({
      where: { leadId: { in: duplicateIds } },
      data: { leadId: primaryId },
    });

    // Mark duplicates with duplicateOfId = primaryId and status = "duplicate"
    await prisma.lead.updateMany({
      where: { id: { in: duplicateIds } },
      data: {
        duplicateOfId: primaryId,
        status: "duplicate",
      },
    });

    // Return updated primary lead
    const updatedLead = await prisma.lead.findUnique({
      where: { id: primaryId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, color: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    logActivitySilent({
      actorId: payload.userId,
      tenantId: payload.tenantId,
      action: "merge",
      entityType: "lead",
      entityId: primaryId,
      entityName: primaryLead.companyName,
      description: `${duplicateIds.length} لید تکراری با لید "${primaryLead.companyName}" ادغام شد`,
      req,
    });

    return ok(updatedLead);
  } catch (e) {
    return serverError(e);
  }
}
