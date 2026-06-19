import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { logActivitySilent } from "@/lib/audit";
import { checkPlanLimit } from "@/lib/plan-limits";
import { triggerWebhook } from "@/lib/webhooks";
import { runAutomation } from "@/lib/automation-engine";
import { leadSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;
    const search = searchParams.get("search") ?? "";

    const where = {
      ...tenantFilter(payload),
      ...(status ? { status } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search } },
              { contactName: { contains: search } },
              { contactPhone: { contains: search } },
            ],
          }
        : {}),
    };

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 50));

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true, color: true } },
          activities: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(leads, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const raw = await req.json();
    const parsed = leadSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("، ");
      return badRequest(msg);
    }
    const body = parsed.data;

    if (payload.tenantId) {
      const limitCheck = await checkPlanLimit(payload.tenantId, "leads");
      if (!limitCheck.allowed) {
        return badRequest(
          `سقف پلن شما تکمیل شده. تعداد لیدها به حداکثر (${limitCheck.limit}) در پلن ${limitCheck.planName} رسیده. برای افزایش محدودیت پلن خود را ارتقا دهید.`
        );
      }
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId: payload.tenantId ?? null,
        companyName: body.companyName,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        estimatedValue: body.estimatedValue ?? 0,
        conversionProbability: body.conversionProbability ?? 0,
        status: body.status ?? "new",
        columnId: body.columnId ?? "new",
        assigneeId: body.assigneeId,
        tags: body.tags ?? [],
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
        source: body.source,
      },
    });

    logActivitySilent({
      actorId: payload.userId,
      tenantId: payload.tenantId,
      action: "create",
      entityType: "lead",
      entityId: lead.id,
      entityName: lead.companyName,
      description: `لید جدید "${lead.companyName}" اضافه شد`,
      req,
    });

    if (payload.tenantId) {
      triggerWebhook(payload.tenantId, "lead.created", lead);
      runAutomation("new_lead", { lead }, payload.tenantId).catch((err) => console.error(err));
    }

    return created(lead);
  } catch (e) {
    return serverError(e);
  }
}
