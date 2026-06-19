import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const flat = searchParams.get("flat") === "true";

    const where = {
      ...tenantFilter(payload),
      ...(search ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] } : {}),
    };

    if (flat) {
      const centers = await prisma.costCenter.findMany({ where, orderBy: { code: "asc" } });
      return ok(centers);
    }

    const centers = await prisma.costCenter.findMany({
      where,
      include: {
        children: { include: { children: true } },
        _count: { select: { budgets: true } },
      },
      orderBy: { code: "asc" },
    });

    const roots = centers.filter(c => !c.parentId);
    return ok(roots, { total: centers.length });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.code?.trim() || !body.name?.trim()) return badRequest("کد و نام مرکز هزینه الزامی است");

    const exists = await prisma.costCenter.findFirst({
      where: { tenantId: payload.tenantId ?? null, code: body.code.trim() },
    });
    if (exists) return badRequest("کد مرکز هزینه تکراری است");

    const center = await prisma.costCenter.create({
      data: {
        tenantId: payload.tenantId ?? null,
        code: body.code.trim(),
        name: body.name.trim(),
        description: body.description ?? null,
        parentId: body.parentId ?? null,
        isActive: body.isActive ?? true,
      },
    });
    return created(center);
  } catch (e) { return serverError(e); }
}
