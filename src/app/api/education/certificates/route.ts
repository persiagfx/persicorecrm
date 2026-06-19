import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const certs = await prisma.eduCertificate.findMany({
    where: { tenantId: payload.tenantId },
    include: { student: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });
  return ok(certs);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const code = randomBytes(8).toString("hex").toUpperCase();
  const cert = await prisma.eduCertificate.create({ data: { ...body, code, tenantId: payload.tenantId } });
  return created(cert);
}
