import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    // Get the client to find tenantId
    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { tenantId: true },
    });
    if (!client) return ok(null);

    // Find active NPS survey for this tenant
    const form = await prisma.surveyForm.findFirst({
      where: {
        tenantId: client.tenantId,
        type: "nps",
        status: "active",
      },
      select: { id: true, title: true, description: true },
    });

    if (!form) return ok(null);

    // Check if this portal user already responded
    const existing = await prisma.formResponse.findFirst({
      where: {
        formId: form.id,
        respondentId: payload.portalUserId,
      },
    });

    if (existing) return ok(null);

    return ok(form);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { formId, score, comment } = body;

    if (!formId) return badRequest("شناسه فرم الزامی است");
    if (typeof score !== "number" || score < 0 || score > 10) return badRequest("امتیاز باید بین ۰ تا ۱۰ باشد");

    // Verify the form exists and is NPS
    const form = await prisma.surveyForm.findFirst({
      where: { id: formId, type: "nps", status: "active" },
    });
    if (!form) return badRequest("فرم یافت نشد");

    // Check for duplicate response
    const existing = await prisma.formResponse.findFirst({
      where: { formId, respondentId: payload.portalUserId },
    });
    if (existing) return badRequest("شما قبلاً به این نظرسنجی پاسخ داده‌اید");

    // Get client tenantId
    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { tenantId: true },
    });

    const response = await prisma.formResponse.create({
      data: {
        formId,
        tenantId: client?.tenantId ?? null,
        respondentId: payload.portalUserId,
        answers: { nps: score, comment: comment ?? "" },
      },
    });

    return created({ submitted: true, id: response.id });
  } catch (e) {
    return serverError(e);
  }
}
