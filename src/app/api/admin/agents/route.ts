import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAuth(req);
    if (!admin) return unauthorized();
    const roleErr = requireRole(admin, "admin");
    if (roleErr) return roleErr;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const userId = url.searchParams.get("userId") ?? "";
    const limit = 20;

    const where = {
      ...(search ? { name: { contains: search } } : {}),
      ...(status ? { status } : { status: { not: "DELETED" as const } }),
      ...(userId ? { userId } : {}),
    };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, plan: true } },
          customization: { select: { primaryColor: true } },
          _count: { select: { conversations: true, knowledge: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    const settings = await prisma.agentSettings.findUnique({ where: { id: "global" } });
    const totalMessages = await prisma.agent.aggregate({ _sum: { totalMessages: true } });
    const totalLeads = await prisma.agent.aggregate({ _sum: { totalLeads: true } });
    const activeCount = await prisma.agent.count({ where: { status: "ACTIVE" } });
    const userCount = await prisma.agentUser.count();

    return ok({
      agents,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        totalAgents: await prisma.agent.count({ where: { status: { not: "DELETED" } } }),
        activeAgents: activeCount,
        totalMessages: totalMessages._sum.totalMessages ?? 0,
        totalLeads: totalLeads._sum.totalLeads ?? 0,
        agentUsers: userCount,
      },
      settings,
    });
  } catch (e) {
    return serverError(e);
  }
}
