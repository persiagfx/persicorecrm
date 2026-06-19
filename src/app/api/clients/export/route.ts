import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();

  const clients = await prisma.client.findMany({
    where: { tenantId: payload.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const header = ["نام شرکت", "نام مخاطب", "تلفن", "ایمیل", "وب‌سایت", "وضعیت", "تاریخ ایجاد"];
  const rows = clients.map(c => [
    c.companyName ?? "",
    c.contactName ?? "",
    c.contactPhone ?? "",
    c.contactEmail ?? "",
    c.website ?? "",
    c.status ?? "",
    new Date(c.createdAt).toLocaleDateString("fa-IR"),
  ]);

  const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${Date.now()}.csv"`,
    },
  });
}
