import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const contracts = await prisma.contract.findMany({
      where: { clientId: payload.clientId, status: { not: "draft" } },
      select: {
        id: true,
        title: true,
        status: true,
        signToken: true,
        content: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        adminSignedAt: true,
        adminSignatureDataUrl: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(contracts);
  } catch (e) {
    return serverError(e);
  }
}
