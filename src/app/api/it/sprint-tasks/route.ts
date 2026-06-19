import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const sprintId = searchParams.get("sprintId");
  const tasks = await prisma.sprintTask.findMany({
    where: { ...(sprintId ? { sprintId } : { sprint: { tenantId: payload.tenantId } }) },
    orderBy: { order: "asc" },
  });
  return ok(tasks);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const task = await prisma.sprintTask.create({ data: body });
  return created(task);
}
