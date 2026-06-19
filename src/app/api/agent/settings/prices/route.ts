import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.agentSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    });
    return ok({
      STARTER: settings.starterPlanPrice,
      PRO: settings.proPlanPrice,
      ENTERPRISE: settings.enterprisePlanPrice,
    });
  } catch (e) {
    return serverError(e);
  }
}
