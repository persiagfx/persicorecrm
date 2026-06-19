import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    const services = await prisma.serviceItem.findMany({
      where: active !== null ? { ...tenantFilter(payload), isActive: active === "true" } : { ...tenantFilter(payload) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return ok(services);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name || !body.code) return badRequest("نام و کد الزامی است");

    const service = await prisma.serviceItem.create({
      data: {
        code: body.code,
        name: body.name,
        category: body.category ?? "other",
        defaultPrice: body.defaultPrice ?? 0,
        unit: body.unit ?? "hour",
        taxRate: body.taxRate ?? 9,
        description: body.description,
        isActive: true,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(service);
  } catch (e) {
    return serverError(e);
  }
}
