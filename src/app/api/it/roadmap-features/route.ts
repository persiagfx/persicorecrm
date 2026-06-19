import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const roadmapId = searchParams.get("roadmapId");
  const features = await prisma.roadmapFeature.findMany({
    where: { ...(roadmapId ? { roadmapId } : { roadmap: { tenantId: payload.tenantId } }) },
    orderBy: { order: "asc" },
  });
  return ok(features);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const feature = await prisma.roadmapFeature.create({ data: body });
  return created(feature);
}
