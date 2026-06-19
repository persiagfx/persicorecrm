import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, notFound, serverError } from "@/lib/auth";
import { requireAgentAuth } from "@/lib/agent-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAgentAuth(req);
    if (!auth) return unauthorized();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({ where: { id, userId: auth.userId } });
    if (!agent) return notFound();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = 20;

    const [conversations, total] = await Promise.all([
      prisma.agentConversation.findMany({
        where: { agentId: id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentConversation.count({ where: { agentId: id } }),
    ]);

    return ok({ conversations, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return serverError(e);
  }
}
