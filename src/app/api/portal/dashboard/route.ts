import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const { clientId } = payload;

    const [projects, invoices, tickets, contracts, messages] = await Promise.all([
      prisma.project.findMany({
        where: { clientId, status: { not: "cancelled" } },
        select: { id: true, name: true, status: true, progress: true, deadline: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { clientId, status: { in: ["sent", "overdue"] } },
        select: { id: true, invoiceNumber: true, total: true, status: true, dueDate: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.portalTicket.findMany({
        where: { clientId, status: { not: "closed" } },
        select: { id: true, title: true, status: true, priority: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.contract.findMany({
        where: { clientId, status: { in: ["sent", "admin_signed"] } },
        select: { id: true, title: true, status: true, signToken: true, expiresAt: true, adminSignedAt: true },
        orderBy: { sentAt: "desc" },
        take: 3,
      }),
      prisma.portalMessage.findMany({
        where: { clientId, isRead: false, authorType: "team" },
        select: { id: true, authorName: true, content: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    const overdueInvoicesTotal = invoices.reduce((s, i) => s + i.total, 0);

    return ok({
      projects,
      overdueInvoices: invoices,
      overdueInvoicesTotal,
      openTickets: tickets,
      pendingContracts: contracts,
      unreadMessages: messages,
    });
  } catch (e) {
    return serverError(e);
  }
}
