import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [requests, feedbacks, schedules] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { tenantId: tid },
        select: { id: true, status: true, priority: true, slaBreached: true, cost: true, createdAt: true, completedAt: true, startedAt: true },
      }),
      prisma.serviceFeedback.findMany({
        where: { request: { tenantId: tid } },
        select: { score: true, submittedAt: true },
      }),
      prisma.technicianSchedule.findMany({
        where: { tenantId: tid, date: { gte: today, lt: weekEnd } },
        select: { id: true, date: true, status: true },
      }),
    ]);

    const open = requests.filter(r => r.status === "new" || r.status === "assigned").length;
    const inProgress = requests.filter(r => r.status === "in_progress").length;
    const resolved = requests.filter(r => r.status === "completed" || r.status === "closed").length;
    const slaBreached = requests.filter(r => r.slaBreached).length;

    const avgFeedback = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + f.score, 0) / feedbacks.length).toFixed(1)
      : null;

    // Resolution time in hours
    const resolvedWithTime = requests.filter(r => r.completedAt && r.createdAt);
    const avgResolutionHrs = resolvedWithTime.length
      ? Math.round(resolvedWithTime.reduce((s, r) => s + (new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime()) / 3600000, 0) / resolvedWithTime.length)
      : null;

    const todaySchedules = schedules.filter(s => new Date(s.date) >= today && new Date(s.date) < tomorrow).length;

    // Priority breakdown
    const byPriority = {
      low: requests.filter(r => r.priority === "low").length,
      medium: requests.filter(r => r.priority === "medium").length,
      high: requests.filter(r => r.priority === "high").length,
      urgent: requests.filter(r => r.priority === "urgent").length,
    };

    // Monthly request trend (last 6 months)
    const since6m = new Date(Date.now() - 180 * 86400000);
    const monthly: Record<string, { new: number; resolved: number }> = {};
    for (const r of requests.filter(r => r.createdAt >= since6m)) {
      const key = r.createdAt.toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { new: 0, resolved: 0 };
      monthly[key].new++;
      if (r.status === "completed" || r.status === "closed") monthly[key].resolved++;
    }
    const monthlyTrend = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));

    return ok({
      total: requests.length,
      open, inProgress, resolved,
      slaBreached,
      avgFeedback: avgFeedback ? Number(avgFeedback) : null,
      totalFeedbacks: feedbacks.length,
      avgResolutionHrs,
      todaySchedules,
      weekSchedules: schedules.length,
      byPriority,
      monthlyTrend,
      totalRevenue: requests.reduce((s, r) => s + r.cost, 0),
    });
  } catch (e) { return serverError(e); }
}
