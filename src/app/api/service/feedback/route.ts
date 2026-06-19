import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const feedbacks = await prisma.serviceFeedback.findMany({
    where: { request: { tenantId: payload.tenantId } },
    include: { request: { select: { number: true, title: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return ok(feedbacks);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const feedback = await prisma.serviceFeedback.create({ data: body });
  return created(feedback);
}
