import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const records = await prisma.eduStudentAttendance.findMany({
    where: { session: { schedule: { tenantId: payload.tenantId } } },
    include: {
      student: { select: { name: true } },
      session: { select: { date: true, topic: true, schedule: { select: { course: { select: { title: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(records);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const record = await prisma.eduStudentAttendance.create({ data: body });
  return created(record);
}
