// Legal cases management — uses LegalCase model
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const docs = await prisma.legalCase.findMany({
      where: {
        ...tenantFilter(payload),
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(search ? { OR: [{ title: { contains: search } }, { caseNumber: { contains: search } }] } : {}),
      },
      include: {
        lawyer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(docs);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title?.trim() || !body.caseNumber?.trim()) {
      return badRequest("عنوان و شماره پرونده الزامی است");
    }

    const doc = await prisma.legalCase.create({
      data: {
        tenantId: payload.tenantId ?? null,
        title: body.title.trim(),
        type: body.type ?? "other",
        caseNumber: body.caseNumber.trim(),
        court: body.court ?? null,
        plaintiff: body.plaintiff ?? "شرکت",
        defendant: body.opposingParty ?? body.defendant ?? "نامشخص",
        lawyerId: body.lawyerId ?? payload.userId,
        clientId: body.clientId ?? null,
        description: body.description ?? null,
        status: body.status ?? "open",
        nextHearing: body.nextHearing ? new Date(body.nextHearing) : null,
      },
    });

    return created(doc);
  } catch (e) { return serverError(e); }
}
