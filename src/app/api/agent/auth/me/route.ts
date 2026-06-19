import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return unauthorized();

    let payload: { userId: string; isAgentUser?: boolean; isCrmUser?: boolean } | null = null;
    try {
      payload = jwt.verify(token, JWT_SECRET) as typeof payload;
    } catch {
      return unauthorized();
    }

    if (!payload) return unauthorized();

    // CRM super-admin SSO — find or create a linked AgentUser
    if (payload.isCrmUser || (!payload.isAgentUser && payload.userId)) {
      const crmUser = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!crmUser) return unauthorized();

      // Find existing AgentUser by phone or email
      let agentUser = await prisma.agentUser.findFirst({
        where: {
          OR: [
            crmUser.phone ? { phone: crmUser.phone } : undefined,
            crmUser.email ? { email: crmUser.email } : undefined,
          ].filter(Boolean) as object[],
        },
      });

      // Auto-create AgentUser for CRM admin on first SSO
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

      return ok({
        id: agentUser.id,
        name: agentUser.name,
        email: agentUser.email,
        phone: agentUser.phone,
        plan: "ENTERPRISE",
        isCrmUser: true,
      });
    }

    const user = await prisma.agentUser.findUnique({
      where: { id: payload.userId },
      include: { subscription: true },
    });
    if (!user || !user.isActive) return unauthorized();

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      plan: user.plan,
      isCrmUser: false,
    });
  } catch (e) {
    return serverError(e);
  }
}
