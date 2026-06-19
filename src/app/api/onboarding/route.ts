import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, badRequest, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tenantId = payload.tenantId ?? payload.userId;

    let progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          tenantId,
          steps: {},
          completed: false,
        },
      });
    }

    return ok(progress);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tenantId = payload.tenantId ?? payload.userId;
    const body = await req.json();
    const { step } = body as { step?: string };

    if (!step) return badRequest("step الزامی است");

    const VALID_STEPS = [
      "company_info",
      "invite_team",
      "first_client",
      "first_lead",
      "invoice_settings",
      "completed",
    ];

    if (!VALID_STEPS.includes(step)) {
      return badRequest("step نامعتبر است");
    }

    let progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { tenantId, steps: {}, completed: false },
      });
    }

    const currentSteps = (progress.steps as Record<string, boolean>) ?? {};
    const updatedSteps = { ...currentSteps, [step]: true };

    const allDone = VALID_STEPS.slice(0, 5).every((s) => updatedSteps[s]);

    const updated = await prisma.onboardingProgress.update({
      where: { tenantId },
      data: {
        steps: updatedSteps,
        completed: allDone || step === "completed",
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
