import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const sprints = await prisma.sprint.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { startDate: "desc" },
  });
  return ok(sprints);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const sprint = await prisma.sprint.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(sprint);
}
