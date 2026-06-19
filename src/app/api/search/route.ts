import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return ok({ clients: [], leads: [], projects: [], invoices: [] });

    const [clients, leads, projects, invoices] = await Promise.all([
      prisma.client.findMany({
        where: {
          ...tenantFilter(payload),
          OR: [
            { companyName: { contains: q } },
            { contactName: { contains: q } },
            { contactPhone: { contains: q } },
          ],
        },
        select: { id: true, companyName: true, contactName: true, status: true },
        take: 5,
      }),
      prisma.lead.findMany({
        where: {
          ...tenantFilter(payload),
          OR: [
            { companyName: { contains: q } },
            { contactName: { contains: q } },
          ],
        },
        select: { id: true, companyName: true, contactName: true, status: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: { ...tenantFilter(payload), name: { contains: q } },
        select: { id: true, name: true, status: true, client: { select: { companyName: true } } },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { ...tenantFilter(payload), invoiceNumber: { contains: q } },
        select: { id: true, invoiceNumber: true, total: true, status: true },
        take: 5,
      }),
    ]);

    return ok({ clients, leads, projects, invoices });
  } catch (e) {
    return serverError(e);
  }
}
