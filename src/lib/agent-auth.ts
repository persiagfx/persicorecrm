import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AgentAuthPayload {
  userId: string;
  plan: string;
  isAgentUser?: boolean;
  isCrmUser?: boolean;
}

export async function getAgentAuth(req: NextRequest): Promise<AgentAuthPayload | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AgentAuthPayload;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAgentAuth(req: NextRequest) {
  const payload = await getAgentAuth(req);
  if (!payload) return null;

  // CRM SSO: translate crmUser.id → AgentUser.id
  if (!payload.isAgentUser) {
    const crmUser = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!crmUser) return null;

    let agentUser = await prisma.agentUser.findFirst({
      where: {
        OR: [
          crmUser.phone ? { phone: crmUser.phone } : undefined,
          crmUser.email ? { email: crmUser.email } : undefined,
        ].filter(Boolean) as object[],
      },
    });

    if (!agentUser) {
      agentUser = await prisma.agentUser.create({
        data: {
          name: crmUser.name ?? "ادمین",
          email: crmUser.email ?? null,
          phone: crmUser.phone ?? null,
          plan: "ENTERPRISE",
        },
      });
    }

    return { userId: agentUser.id, plan: agentUser.plan, isCrmUser: true };
  }

  return payload;
}

export function getPlanLimits(plan: string) {
  const limits: Record<string, { maxAgents: number; maxMessages: number }> = {
    FREE:       { maxAgents: 1,  maxMessages: 100 },
    STARTER:    { maxAgents: 3,  maxMessages: 1000 },
    PRO:        { maxAgents: 10, maxMessages: 5000 },
    ENTERPRISE: { maxAgents: 50, maxMessages: 50000 },
  };
  return limits[plan] ?? limits.FREE;
}
