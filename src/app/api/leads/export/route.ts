import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();

  const leads = await prisma.lead.findMany({
    where: { tenantId: payload.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const header = ["عنوان", "نام مخاطب", "تلفن", "ایمیل", "شرکت", "مرحله", "ارزش", "تاریخ ایجاد"];
  const rows = leads.map(l => [
    l.title ?? "",
    l.contactName ?? "",
    l.phone ?? "",
    l.email ?? "",
    l.company ?? "",
    l.status ?? "",
    l.value?.toString() ?? "0",
    new Date(l.createdAt).toLocaleDateString("fa-IR"),
  ]);

  const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
    },
  });
}
