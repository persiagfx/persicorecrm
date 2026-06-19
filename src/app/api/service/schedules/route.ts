import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const schedules = await prisma.technicianSchedule.findMany({ where: { tenantId: payload.tenantId }, orderBy: [{ date: "desc" }, { startTime: "asc" }] });
  return ok(schedules);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const schedule = await prisma.technicianSchedule.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(schedule);
}
