import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const isActive = searchParams.get("active");

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        ...tenantFilter(payload),
        ...(type ? { type } : {}),
        ...(isActive !== null ? { isActive: isActive === "true" } : {}),
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        _count: { select: { children: true, debitEntries: true, creditEntries: true } },
      },
      orderBy: [{ code: "asc" }],
    });

    return ok(accounts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.code?.trim() || !body.name?.trim()) return badRequest("کد و نام حساب الزامی است");

    const account = await prisma.chartOfAccount.create({
      data: {
        tenantId: payload.tenantId ?? null,
        code: body.code.trim(),
        name: body.name.trim(),
        nameFa: body.nameFa?.trim() || body.name.trim(),
        type: body.type ?? "asset",
        parentId: body.parentId ?? null,
        description: body.description ?? null,
        isActive: true,
      },
    });

    return created(account);
  } catch (e) { return serverError(e); }
}
