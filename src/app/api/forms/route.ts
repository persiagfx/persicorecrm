import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const forms = await prisma.surveyForm.findMany({
      where: { ...tenantFilter(payload) },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { responses: true } },
      },
    });

    // Compute lead count per form (responses that have a leadId)
    const leadCounts = await prisma.formResponse.groupBy({
      by: ["formId"],
      where: {
        formId: { in: forms.map((f) => f.id) },
        leadId: { not: null },
      },
      _count: { leadId: true },
    });

    const leadCountMap: Record<string, number> = {};
    for (const row of leadCounts) {
      leadCountMap[row.formId] = row._count.leadId;
    }

    const result = forms.map((f) => {
      const questions = Array.isArray(f.questions) ? (f.questions as Record<string, unknown>[]) : [];
      const configEntry = questions.find((q) => q.__config__ === true);
      const leadMappingEnabled = configEntry ? Boolean(configEntry.leadMappingEnabled) : false;
      return {
        ...f,
        leadMappingEnabled,
        leadCount: leadCountMap[f.id] ?? 0,
      };
    });

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title) return badRequest("عنوان الزامی است");

    const form = await prisma.surveyForm.create({
      data: {
        title: body.title,
        description: body.description,
        questions: body.questions ?? [],
        status: body.status ?? "draft",
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(form);
  } catch (e) {
    return serverError(e);
  }
}
