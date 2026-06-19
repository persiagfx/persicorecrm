import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const now = new Date();
    const unpaid = await prisma.invoice.findMany({
      where: {
        tenantId: payload.tenantId ?? null,
        status: { in: ["sent", "overdue", "draft"] },
      },
      include: { client: { select: { id: true, companyName: true, contactName: true } } },
      orderBy: { dueDate: "asc" },
    });

    const buckets = {
      current: { label: "جاری (نرسیده)", items: [] as typeof unpaid, total: 0 },
      days30: { label: "۱–۳۰ روز", items: [] as typeof unpaid, total: 0 },
      days60: { label: "۳۱–۶۰ روز", items: [] as typeof unpaid, total: 0 },
      days90: { label: "۶۱–۹۰ روز", items: [] as typeof unpaid, total: 0 },
      over90: { label: "+۹۰ روز", items: [] as typeof unpaid, total: 0 },
    };

    for (const inv of unpaid) {
      const daysPast = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      let bucket: keyof typeof buckets;
      if (daysPast <= 0) bucket = "current";
      else if (daysPast <= 30) bucket = "days30";
      else if (daysPast <= 60) bucket = "days60";
      else if (daysPast <= 90) bucket = "days90";
      else bucket = "over90";
      buckets[bucket].items.push(inv);
      buckets[bucket].total += inv.total;
    }

    const summary = Object.entries(buckets).map(([key, b]) => ({
      key, label: b.label, count: b.items.length, total: b.total,
    }));

    return ok({ buckets, summary, totalOutstanding: unpaid.reduce((s, i) => s + i.total, 0) });
  } catch (e) { return serverError(e); }
}
