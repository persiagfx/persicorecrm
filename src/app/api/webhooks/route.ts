import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const webhooks = await prisma.webhook.findMany({
      where: payload.tenantId ? { tenantId: payload.tenantId } : {},
      orderBy: { createdAt: "desc" },
    });

    return ok(webhooks);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.name || !body.url || !Array.isArray(body.events) || body.events.length === 0) {
      return badRequest("نام، آدرس URL و حداقل یک رویداد الزامی است");
    }

    const webhook = await prisma.webhook.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name,
        url: body.url,
        events: body.events,
        secret: body.secret ?? null,
        isActive: true,
      },
    });

    return created(webhook);
  } catch (e) {
    return serverError(e);
  }
}
