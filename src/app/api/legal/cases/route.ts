import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const cases = await prisma.legalCase.findMany({
      where: {
        ...tenantFilter(payload),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      include: { client: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(cases);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title || !body.plaintiff || !body.defendant)
      return badRequest("عنوان، خواهان و خوانده الزامی است");

    const count = await prisma.legalCase.count();
    const caseNumber = `LC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const legalCase = await prisma.legalCase.create({
      data: {
        tenantId: payload.tenantId ?? null,
        caseNumber,
        title: body.title,
        type: body.type ?? "other",
        status: "open",
        plaintiff: body.plaintiff,
        defendant: body.defendant,
        court: body.court,
        lawyerId: body.lawyerId ?? payload.userId,
        clientId: body.clientId,
        nextHearing: body.nextHearing ? new Date(body.nextHearing) : undefined,
        description: body.description,
      },
    });

    return created(legalCase);
  } catch (e) {
    return serverError(e);
  }
}
