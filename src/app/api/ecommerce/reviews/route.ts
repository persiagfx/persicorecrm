import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const reviews = await prisma.ecomProductReview.findMany({
    where: { tenantId: payload.tenantId },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(reviews.map(r => ({ ...r, productName: r.product.name })));
}
