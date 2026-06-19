import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  requireAuth,
  ok,
  unauthorized,
  notFound,
  serverError,
  tenantFilter,
} from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;

    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, ...tenantFilter(payload) },
    });
    if (!funnel) return notFound("قیف فروش");

    const stages = funnel.stages as Array<{
      id: string;
      name: string;
      color: string;
      order: number;
    }>;

    const leads = await prisma.lead.findMany({
      where: tenantFilter(payload),
      select: {
        id: true,
        status: true,
        columnId: true,
        estimatedValue: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Only non-terminal stages for active pipeline
    const activeStageIds = stages
      .filter((s) => s.id !== "won" && s.id !== "lost")
      .map((s) => s.id);

    const allLeadsInFunnel = leads.filter((l) =>
      stages.some((s) => s.id === (l.columnId || l.status))
    );

    const wonLeads = leads.filter(
      (l) => l.columnId === "won" || l.status === "won"
    );
    const lostLeads = leads.filter(
      (l) => l.columnId === "lost" || l.status === "lost"
    );

    const enteredFunnel = leads.filter((l) =>
      activeStageIds.concat(["won", "lost"]).includes(l.columnId || l.status)
    );

    const proposalLeads = leads.filter(
      (l) => l.columnId === "proposal" || l.status === "proposal"
    );

    const overallConversion =
      enteredFunnel.length > 0
        ? Math.round((wonLeads.length / enteredFunnel.length) * 100)
        : 0;

    const reachedProposal =
      enteredFunnel.length > 0
        ? Math.round(
            ((proposalLeads.length + wonLeads.length) / enteredFunnel.length) *
              100
          )
        : 0;

    // Avg deal cycle: days from createdAt to updatedAt for won leads
    const avgDealCycleDays =
      wonLeads.length > 0
        ? Math.round(
            wonLeads.reduce((sum, l) => {
              const days =
                (new Date(l.updatedAt).getTime() -
                  new Date(l.createdAt).getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / wonLeads.length
          )
        : 0;

    const stageStats = stages.map((stage, i) => {
      const stageLeads = leads.filter(
        (l) => l.columnId === stage.id || l.status === stage.id
      );

      const prevStage = i > 0 ? stages[i - 1] : null;
      const prevCount = prevStage
        ? leads.filter(
            (l) => l.columnId === prevStage.id || l.status === prevStage.id
          ).length
        : stageLeads.length;

      const conversionRate =
        i === 0
          ? 100
          : prevCount > 0
          ? Math.round((stageLeads.length / prevCount) * 100)
          : 0;

      const avgDaysInStage =
        stageLeads.length > 0
          ? Math.round(
              stageLeads.reduce((sum, l) => {
                const days =
                  (new Date(l.updatedAt).getTime() -
                    new Date(l.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / stageLeads.length
            )
          : 0;

      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        leadCount: stageLeads.length,
        totalValue: stageLeads.reduce((s, l) => s + l.estimatedValue, 0),
        conversionRate,
        avgDaysInStage,
      };
    });

    const totalValue = allLeadsInFunnel.reduce(
      (s, l) => s + l.estimatedValue,
      0
    );

    return ok({
      stages: stageStats,
      totalValue,
      overallConversion,
      reachedProposal,
      totalLeadsEntered: enteredFunnel.length,
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      avgDealCycleDays,
    });
  } catch (e) {
    return serverError(e);
  }
}
