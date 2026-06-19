import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "month"; // month | quarter | year

    const now = new Date();
    let startDate: Date;
    if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // لیدهای برنده‌شده در این بازه
    const wonLeads = await prisma.lead.findMany({
      where: {
        status: "won",
        updatedAt: { gte: startDate },
        assigneeId: { not: null },
      },
      select: {
        id: true,
        estimatedValue: true,
        assigneeId: true,
        assignee: { select: { id: true, name: true, avatar: true, color: true, role: true } },
      },
    });

    // گروه‌بندی بر اساس assignee
    const statsMap: Record<string, {
      userId: string;
      name: string;
      avatar: string | null;
      color: string;
      deals: number;
      totalValue: number;
    }> = {};

    for (const lead of wonLeads) {
      if (!lead.assigneeId || !lead.assignee) continue;
      if (!statsMap[lead.assigneeId]) {
        statsMap[lead.assigneeId] = {
          userId: lead.assigneeId,
          name: lead.assignee.name,
          avatar: lead.assignee.avatar,
          color: lead.assignee.color,
          deals: 0,
          totalValue: 0,
        };
      }
      statsMap[lead.assigneeId].deals++;
      statsMap[lead.assigneeId].totalValue += lead.estimatedValue;
    }

    // تمام لیدهای هر نفر برای محاسبه نرخ تبدیل
    const allLeads = await prisma.lead.findMany({
      where: {
        updatedAt: { gte: startDate },
        assigneeId: { not: null },
      },
      select: { assigneeId: true, status: true },
    });

    const totalLeadsMap: Record<string, number> = {};
    for (const l of allLeads) {
      if (!l.assigneeId) continue;
      totalLeadsMap[l.assigneeId] = (totalLeadsMap[l.assigneeId] ?? 0) + 1;
    }

    const leaderboard = Object.values(statsMap)
      .map((s) => ({
        ...s,
        totalLeads: totalLeadsMap[s.userId] ?? s.deals,
        conversionRate: totalLeadsMap[s.userId]
          ? Math.round((s.deals / totalLeadsMap[s.userId]) * 100)
          : 100,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    // KPIs کل
    const totalDeals = wonLeads.length;
    const totalValue = wonLeads.reduce((s, l) => s + l.estimatedValue, 0);

    return ok({ leaderboard, totalDeals, totalValue, period, startDate });
  } catch (e) {
    return serverError(e);
  }
}
