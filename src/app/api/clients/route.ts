import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";
import { logActivitySilent } from "@/lib/audit";
import { checkClientLimit } from "@/lib/tenant-limits";
import { checkPlanLimit } from "@/lib/plan-limits";
import { clientSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

    const where = {
      ...tenantFilter(payload),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search } },
              { contactName: { contains: search } },
              { contactPhone: { contains: search } },
              { contactEmail: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok(clients, { total, page, perPage });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const raw = await req.json();
    const parsed = clientSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("، ");
      return badRequest(msg);
    }
    const body = parsed.data;

    const limitErr = await checkClientLimit(payload);
    if (limitErr) return badRequest(limitErr);

    if (payload.tenantId) {
      const limitCheck = await checkPlanLimit(payload.tenantId, "clients");
      if (!limitCheck.allowed) {
        return badRequest(
          `سقف پلن شما تکمیل شده. تعداد مشتریان به حداکثر (${limitCheck.limit}) در پلن ${limitCheck.planName} رسیده. برای افزایش محدودیت پلن خود را ارتقا دهید.`
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        tenantId: payload.tenantId ?? null,
        companyName: body.companyName,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
        address: body.address,
        website: body.website,
        status: body.status ?? "active",
        tags: body.tags ?? [],
        notes: body.notes,
        anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate) : undefined,
      },
    });

    logActivitySilent({
      actorId: payload.userId,
      tenantId: payload.tenantId,
      action: "create",
      entityType: "client",
      entityId: client.id,
      entityName: client.companyName,
      description: `مشتری جدید "${client.companyName}" اضافه شد`,
      req,
    });

    return created(client);
  } catch (e) {
    return serverError(e);
  }
}
