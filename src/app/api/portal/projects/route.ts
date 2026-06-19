import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const projects = await prisma.project.findMany({
      where: { clientId: payload.clientId },
      include: {
        milestones: { orderBy: { dueDate: "asc" } },
        timeEntries: { select: { durationSeconds: true } },
        invoices: { select: { id: true, total: true, status: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        deployChecklists: {
          select: {
            id: true,
            environment: true,
            items: true,
            deployedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const doneTasks = p.tasks.filter((t) => t.status === "done" || t.status === "completed").length;
      const inProgressTasks = p.tasks.filter((t) => t.status === "in_progress").length;
      const overdueTasks = p.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done" && t.status !== "completed"
      ).length;

      const totalInvoiced = p.invoices.reduce((s, inv) => s + inv.total, 0);
      const paidInvoices = p.invoices.filter((inv) => inv.status === "paid").reduce((s, inv) => s + inv.total, 0);

      // Compute checklist summary
      const checklistSummary = p.deployChecklists.map((cl) => {
        const items = cl.items as Array<{ id: string; label: string; done: boolean }>;
        const total = items.length;
        const done = items.filter((i) => i.done).length;
        return {
          id: cl.id,
          environment: cl.environment,
          total,
          done,
          deployedAt: cl.deployedAt,
        };
      });

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        startDate: p.startDate,
        deadline: p.deadline,
        completedAt: p.completedAt,
        totalTrackedSeconds: p.timeEntries.reduce((s, t) => s + t.durationSeconds, 0),
        milestones: p.milestones,
        taskStats: { total: totalTasks, done: doneTasks, inProgress: inProgressTasks, overdue: overdueTasks },
        invoiceStats: { totalInvoiced, paid: paidInvoices, unpaid: totalInvoiced - paidInvoices },
        checklistSummary,
        recentTasks: p.tasks
          .filter((t) => t.status !== "done" && t.status !== "completed")
          .slice(0, 5),
      };
    });

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
