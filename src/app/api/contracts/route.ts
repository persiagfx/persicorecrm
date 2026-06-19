import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const contracts = await prisma.contract.findMany({
      where: {
        ...tenantFilter(payload),
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        client: { select: { id: true, companyName: true } },
        project: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(contracts);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.clientId || !body.title)
      return badRequest("مشتری و عنوان الزامی است");

    const contract = await prisma.contract.create({
      data: {
        tenantId: payload.tenantId ?? null,
        clientId: body.clientId,
        projectId: body.projectId,
        templateId: body.templateId,
        title: body.title,
        content: body.content ?? "",
        status: "draft",
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
      include: {
        client: { select: { id: true, companyName: true, contactName: true } },
      },
    });

    return created(contract);
  } catch (e) {
    return serverError(e);
  }
}

// suppress unused import warning
void randomBytes;
