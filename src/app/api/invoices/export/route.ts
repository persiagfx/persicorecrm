import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: payload.tenantId },
    include: { client: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = ["شماره فاکتور", "مشتری", "مبلغ کل", "وضعیت", "تاریخ صدور", "تاریخ سررسید"];
  const rows = invoices.map(inv => [
    inv.invoiceNumber ?? inv.id.slice(-6),
    inv.client?.companyName ?? "",
    inv.total?.toString() ?? "0",
    inv.status,
    inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("fa-IR") : "",
    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("fa-IR") : "",
  ]);

  const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const bom = "﻿"; // UTF-8 BOM for Excel Persian support

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${Date.now()}.csv"`,
    },
  });
}
