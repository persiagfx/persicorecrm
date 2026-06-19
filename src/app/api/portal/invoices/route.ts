import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const invoices = await prisma.invoice.findMany({
      where: { clientId: payload.clientId, status: { not: "draft" } },
      include: {
        project: { select: { id: true, name: true } },
        installments: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return ok(invoices);
  } catch (e) {
    return serverError(e);
  }
}
