import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const roadmaps = await prisma.productRoadmap.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { features: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(roadmaps);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const roadmap = await prisma.productRoadmap.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(roadmap);
}
