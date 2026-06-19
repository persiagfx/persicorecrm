import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const licenses = await prisma.softwareLicense.findMany({
    where: { tenantId: payload.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return ok(licenses);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const license = await prisma.softwareLicense.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(license);
}
